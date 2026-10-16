-- Private storage for published sermon recordings.
-- Storage objects remain inaccessible to anon/authenticated roles; the
-- server-side authorization route issues short-lived signed playback URLs.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'sermon-audio',
  'sermon-audio',
  false,
  524288000,
  array[
    'audio/mpeg',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
    'audio/flac'
  ]::text[]
);
