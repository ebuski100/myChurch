SELECT
  id,
  title,
  slug,
  publication_status,
  published_at,
  NOW() AS database_time
FROM public.gallery_albums
WHERE id = '7d0ef25f-1690-4dfa-8e4a-0decdb7b0edf';