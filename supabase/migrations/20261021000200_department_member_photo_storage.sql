-- VictoryCity department member photos.
-- Member photos stay in private object storage; the server signs short-lived
-- URLs for approved public profiles only. No Storage object policy is created
-- here, so the bucket is never publicly readable.

begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'department-member-photos',
  'department-member-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
);

commit;
