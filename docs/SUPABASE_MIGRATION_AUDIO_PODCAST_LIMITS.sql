-- Add daily feature counters for Audio Study and Podcast generation
alter table public.user_limits
  add column if not exists daily_audio_lesson_count integer not null default 0,
  add column if not exists daily_podcast_count integer not null default 0;

