import type { MediaVideo } from './media'
import getAdminSupabase from './supabaseAdmin'

export async function getSyncedVideos(): Promise<MediaVideo[]> {
  try {
    const { data, error } = await getAdminSupabase()
      .from('media')
      .select('caption_en, category, metadata')
      .eq('type', 'video')
      .eq('provider', 'youtube')
      .order('metadata->>publishedAt', { ascending: false })

    if (error) {
      console.error('[videos] getSyncedVideos failed:', error.message)
      return []
    }

    const videos: MediaVideo[] = []
    for (const row of (data as any[]) ?? []) {
      const metadata = (row?.metadata ?? {}) as {
        youtubeId?: string
        title?: string
        publishedAt?: string
        year?: string
        thumbnail?: string
        duration?: string
      }
      const youtubeId = metadata.youtubeId
      if (!youtubeId || !row.caption_en) continue
      videos.push({
        id: youtubeId,
        title: row.caption_en,
        category: row.category ?? 'Latest',
        year: metadata.year?.toString() ?? (metadata.publishedAt ? metadata.publishedAt.slice(0, 4) : ''),
        youtubeId,
        thumbnail: metadata.thumbnail || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
        duration: metadata.duration ?? undefined
      })
    }
    return videos
  } catch (err) {
    console.error('[videos] getSyncedVideos threw:', err)
    return []
  }
}