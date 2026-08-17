create unique index if not exists media_youtube_video_id_idx
  on media ((metadata ->> 'youtubeId'))
  where provider = 'youtube';