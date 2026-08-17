import getAdminSupabase from './supabaseAdmin'

const DEFAULT_CHANNEL_ID = 'UCGuIVgrGUhcZyB13wQpVK8A'
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

export type SyncedVideo = {
  youtubeId: string
  videoType: 'video' | 'short'
  title: string
  publishedAt: string
  year: string
  description: string
  thumbnail: string
  duration?: string
  category: string
  categories: string[]
}

type SyncResult = {
  source: 'youtube-api' | 'youtube-rss'
  inserted: number
  updated: number
  removed: number
  total: number
  channelId: string
}

function getChannelId(): string {
  return process.env.YOUTUBE_CHANNEL_ID?.trim() || DEFAULT_CHANNEL_ID
}

function getApiKey(): string | undefined {
  return process.env.YOUTUBE_API_KEY?.trim() || undefined
}

async function ytFetchJson(url: string, signal?: AbortSignal): Promise<any> {
  const res = await fetch(url, { signal })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const apiMessage: string = body?.error?.message ?? ''
    const message = apiMessage
      ? `YouTube API ${res.status}: ${apiMessage}`
      : `YouTube API responded with ${res.status}`
    throw new Error(message)
  }
  return body
}

function pickThumbnail(thumbnails: any): string | undefined {
  if (!thumbnails) return undefined
  const preferred = ['maxres', 'high', 'medium', 'standard', 'default']
  for (const key of preferred) {
    if (thumbnails[key]?.url) return thumbnails[key].url
  }
  return undefined
}

function isoDurationToClock(iso: string): string {
  const match = iso.match(/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!match) return iso
  const hours = parseInt(match[2] || '0', 10)
  const minutes = parseInt(match[3] || '0', 10)
  const seconds = parseInt(match[4] || '0', 10)
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function isoDurationToSeconds(iso: string): number {
  const match = iso.match(/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!match) return Infinity
  return (
    parseInt(match[1] || '0', 10) * 86400 +
    parseInt(match[2] || '0', 10) * 3600 +
    parseInt(match[3] || '0', 10) * 60 +
    parseInt(match[4] || '0', 10)
  )
}

function classifyVideoType(alternateHref: string): 'video' | 'short' {
  return /\/shorts\//.test(alternateHref) ? 'short' : 'video'
}

async function resolveUploadsPlaylistId(channelId: string, signal?: AbortSignal): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('Missing YOUTUBE_API_KEY')
  const body = await ytFetchJson(
    `${YOUTUBE_API_BASE}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`,
    signal
  )
  const uploadsId = body?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
  if (!uploadsId) throw new Error(`No uploads playlist found for channel ${channelId}`)
  return uploadsId
}

async function fetchAllUploadVideoIds(
  uploadsPlaylistId: string,
  signal?: AbortSignal
): Promise<string[]> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('Missing YOUTUBE_API_KEY')
  const ids: string[] = []
  let pageToken = ''
  for (let page = 0; page < 10; page += 1) {
    const url = `${YOUTUBE_API_BASE}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`
    const body = await ytFetchJson(url, signal)
    for (const item of body?.items ?? []) {
      if (item?.contentDetails?.videoId) ids.push(item.contentDetails.videoId)
    }
    pageToken = body?.nextPageToken
    if (!pageToken) break
  }
  return ids
}

async function fetchVideoDetails(
  ids: string[],
  signal?: AbortSignal
): Promise<{ youtubeId: string; title: string; publishedAt: string; description: string; thumbnail: string | undefined; duration: string; durationIso?: string }[]> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('Missing YOUTUBE_API_KEY')
  const items: any[] = []
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50)
    const body = await ytFetchJson(
      `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${batch.join(',')}&maxResults=50&key=${apiKey}`,
      signal
    )
    items.push(...(body?.items ?? []))
  }
  return items
    .filter((item) => item?.id && item?.snippet)
    .map((item) => ({
      youtubeId: item.id as string,
      title: (item.snippet.title as string) || 'Untitled',
      publishedAt: item.snippet.publishedAt as string,
      description: (item.snippet.description as string) || '',
      thumbnail: pickThumbnail(item.snippet.thumbnails),
      duration: item.contentDetails?.duration ? isoDurationToClock(item.contentDetails.duration as string) : '',
      durationIso: item.contentDetails?.duration as string | undefined
    }))
}

async function fetchChannelPlaylistCategories(
  channelId: string,
  signal?: AbortSignal
): Promise<{ categoryMap: Map<string, string[]>; playlistOrder: string[] }> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('Missing YOUTUBE_API_KEY')
  const categoryMap = new Map<string, string[]>()
  const playlistOrder: string[] = []
  const playlistsBody = await ytFetchJson(
    `${YOUTUBE_API_BASE}/playlists?part=snippet&channelId=${channelId}&maxResults=50&key=${apiKey}`,
    signal
  )
  const playlists = playlistsBody?.items ?? []
  for (const playlist of playlists) {
    const playlistId = playlist?.id
    const title = playlist?.snippet?.title
    if (!playlistId || !title) continue
    playlistOrder.push(title as string)
    let pageToken = ''
    for (let page = 0; page < 5; page += 1) {
      const url = `${YOUTUBE_API_BASE}/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=50&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`
      const body = await ytFetchJson(url, signal)
      for (const item of body?.items ?? []) {
        const videoId = item?.contentDetails?.videoId
        if (!videoId) continue
        const existing = categoryMap.get(videoId as string) ?? []
        if (!existing.includes(title as string)) existing.push(title as string)
        categoryMap.set(videoId as string, existing)
      }
      pageToken = body?.nextPageToken
      if (!pageToken) break
    }
  }
  return { categoryMap, playlistOrder }
}

function assignCategories(
  videos: { youtubeId: string }[],
  categoryMap: Map<string, string[]>,
  playlistOrder: string[]
): { category: string; categories: string[] }[] {
  return videos.map((video) => {
    const memberships = categoryMap.get(video.youtubeId) ?? []
    const ordered = [...memberships].sort((a, b) => playlistOrder.indexOf(a) - playlistOrder.indexOf(b))
    return { category: ordered[0] ?? 'Latest', categories: ordered }
  })
}

async function fetchVideosFromApi(channelId: string, signal?: AbortSignal): Promise<SyncedVideo[]> {
  const uploadsPlaylistId = await resolveUploadsPlaylistId(channelId, signal)
  const videoIds = await fetchAllUploadVideoIds(uploadsPlaylistId, signal)
  const details = await fetchVideoDetails(videoIds, signal)
  const { categoryMap, playlistOrder } = await fetchChannelPlaylistCategories(channelId, signal)
  const categorized = assignCategories(details, categoryMap, playlistOrder)
  return details.map((d, index) => ({
    youtubeId: d.youtubeId,
    videoType: d.durationIso && isoDurationToSeconds(d.durationIso) <= 60 ? 'short' : 'video',
    title: d.title,
    publishedAt: d.publishedAt,
    year: d.publishedAt.slice(0, 4),
    description: d.description,
    thumbnail: d.thumbnail || `https://img.youtube.com/vi/${d.youtubeId}/hqdefault.jpg`,
    duration: d.duration || undefined,
    category: categorized[index].category,
    categories: categorized[index].categories
  }))
}

function parseRssVideos(xml: string): SyncedVideo[] {
  const videos: SyncedVideo[] = []
  const entryPattern = /<entry>([\s\S]*?)<\/entry>/g
  let entryMatch: RegExpExecArray | null
  while ((entryMatch = entryPattern.exec(xml)) !== null) {
    const block = entryMatch[1]
    const youtubeId = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]
    const title = block.match(/<media:title>([^<]*)<\/media:title>/)?.[1]?.trim()
    const thumbnail = block.match(/<media:thumbnail url="([^"]+)"/)?.[1]
    const publishedAt = block.match(/<published>([^<]+)<\/published>/)?.[1]
    const alternate = block.match(/<link rel="alternate" href="([^"]+)"/)?.[1]
    if (!youtubeId) continue
    videos.push({
      youtubeId,
      videoType: classifyVideoType(alternate || `https://www.youtube.com/watch?v=${youtubeId}`),
      title: title || 'Untitled',
      publishedAt: publishedAt || '',
      year: publishedAt ? publishedAt.slice(0, 4) : '',
      description: '',
      thumbnail: thumbnail || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      category: 'Latest',
      categories: []
    })
  }
  return videos
}

async function fetchVideosFromRss(channelId: string, signal?: AbortSignal): Promise<SyncedVideo[]> {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, { signal })
  if (!res.ok) throw new Error(`YouTube RSS responded with ${res.status}`)
  const xml = await res.text()
  return parseRssVideos(xml)
}

async function loadSyncedVideos(signal?: AbortSignal): Promise<{ videos: SyncedVideo[]; source: SyncResult['source'] }> {
  const channelId = getChannelId()
  const apiKey = getApiKey()
  if (apiKey) {
    return { videos: await fetchVideosFromApi(channelId, signal), source: 'youtube-api' }
  }
  return { videos: await fetchVideosFromRss(channelId, signal), source: 'youtube-rss' }
}

function videoToRow(video: SyncedVideo) {
  return {
    type: 'video',
    provider: 'youtube',
    caption_en: video.title,
    category: video.category,
    public_url: `https://www.youtube.com/watch?v=${video.youtubeId}`,
    metadata: {
      youtubeId: video.youtubeId,
      videoType: video.videoType,
      title: video.title,
      publishedAt: video.publishedAt,
      year: video.year,
      description: video.description,
      thumbnail: video.thumbnail,
      duration: video.duration ?? null,
      categories: video.categories,
      url: `https://www.youtube.com/watch?v=${video.youtubeId}`
    }
  }
}

async function upsertVideos(videos: SyncedVideo[]): Promise<{ inserted: number; updated: number; removed: number }> {
  const supabase = getAdminSupabase()
  const rows = videos.map(videoToRow)

  const { data: existingIds, error: selectError } = await supabase
    .from('media')
    .select('id, metadata->youtubeId')
    .eq('provider', 'youtube')
    .in('metadata->>youtubeId', videos.map((v) => v.youtubeId))

  if (selectError) throw new Error(`Failed to read existing videos: ${selectError.message}`)

  const existingById = new Map<string, string>()
  for (const row of existingIds ?? []) {
    const id = (row as any)?.['metadata->youtubeId'] ?? (row as any)?.metadata?.youtubeId
    const rowId = (row as any)?.id
    if (id && rowId && !existingById.has(id)) existingById.set(id, rowId)
  }

  let inserted = 0
  let updated = 0
  for (const row of rows) {
    const existingId = existingById.get(row.metadata.youtubeId)
    if (existingId) {
      const { error } = await (supabase.from('media') as any).update(row).eq('id', existingId)
      if (error) {
        if (error.code === '23505') continue
        throw new Error(`Failed to update ${row.metadata.youtubeId}: ${error.message}`)
      }
      updated += 1
    } else {
      const { error } = await (supabase.from('media') as any).insert(row)
      if (error) {
        if (error.code === '23505') {
          const { error: updateError } = await (supabase.from('media') as any).update(row).eq('metadata->>youtubeId', row.metadata.youtubeId)
          if (updateError && updateError.code !== '23505') {
            throw new Error(`Failed to recover duplicate ${row.metadata.youtubeId}: ${updateError.message}`)
          }
          updated += 1
        } else {
          throw new Error(`Failed to insert ${row.metadata.youtubeId}: ${error.message}`)
        }
      } else {
        inserted += 1
      }
    }
  }

  let removed = 0
  const { data: allRows, error: allError } = await supabase
    .from('media')
    .select('id, metadata')
    .eq('provider', 'youtube')
  if (allError) throw new Error(`Failed to list current videos: ${allError.message}`)

  const currentIds = new Set(videos.map((v) => v.youtubeId))
  const staleIds: string[] = []
  for (const row of (allRows as any[]) ?? []) {
    const youtubeId = row?.metadata?.youtubeId
    if (youtubeId && !currentIds.has(youtubeId)) staleIds.push(row.id)
  }
  if (staleIds.length > 0) {
    const { error: deleteError } = await supabase.from('media').delete().in('id', staleIds)
    if (deleteError) throw new Error(`Failed to remove stale videos: ${deleteError.message}`)
    removed = staleIds.length
  }

  return { inserted, updated, removed }
}

export async function syncYoutubeVideos(signal?: AbortSignal): Promise<SyncResult> {
  const channelId = getChannelId()
  const { videos, source } = await loadSyncedVideos(signal)
  const { inserted, updated, removed } = await upsertVideos(videos)
  const total = videos.length
  return { source, inserted, updated, removed, total, channelId }
}