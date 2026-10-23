-- VictoryCity departments foundation.
-- Department/member records are separate from the existing ministries feature.
-- Public member details require an explicit is_public + published opt-in.

begin;

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(btrim(name)) > 0),
  short_description text,
  description text,
  mission text,
  meeting_information text,
  contact_label text,
  contact_url text,
  cover_asset_id uuid references public.assets (id) on delete set null,
  sort_order integer not null default 0,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint departments_published_timestamp check (
    publication_status <> 'published' or published_at is not null
  ),
  constraint departments_contact_pair check (
    (contact_label is null and contact_url is null)
    or (contact_label is not null and contact_url is not null)
  )
);

create index departments_publication_idx
  on public.departments (publication_status, published_at desc, sort_order);

create table public.department_members (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments (id) on delete cascade,
  full_name text not null check (length(btrim(full_name)) > 0),
  role_title text,
  biography text,
  photo_asset_id uuid references public.assets (id) on delete set null,
  sort_order integer not null default 0,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index department_members_department_idx
  on public.department_members (department_id, publication_status, sort_order);

create trigger departments_set_updated_at before update on public.departments
  for each row execute function public.set_updated_at();
create trigger department_members_set_updated_at before update on public.department_members
  for each row execute function public.set_updated_at();

alter table public.departments enable row level security;
alter table public.department_members enable row level security;

revoke all on public.departments, public.department_members from public, anon, authenticated;
grant select on public.departments, public.department_members to anon, authenticated;
grant insert, update, delete on public.departments, public.department_members to authenticated;

create policy departments_read_published on public.departments
  for select to anon, authenticated
  using (publication_status = 'published' and published_at <= now());
create policy departments_admin_read on public.departments
  for select to authenticated using ((select public.is_admin()));
create policy departments_admin_insert on public.departments
  for insert to authenticated with check ((select public.is_admin()));
create policy departments_admin_update on public.departments
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy departments_admin_delete on public.departments
  for delete to authenticated using ((select public.is_admin()));

create policy department_members_read_public on public.department_members
  for select to anon, authenticated
  using (
    is_public
    and publication_status = 'published'
    and exists (
      select 1 from public.departments d
      where d.id = department_id
        and d.publication_status = 'published'
        and d.published_at <= now()
    )
  );
create policy department_members_admin_read on public.department_members
  for select to authenticated using ((select public.is_admin()));
create policy department_members_admin_insert on public.department_members
  for insert to authenticated with check ((select public.is_admin()));
create policy department_members_admin_update on public.department_members
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy department_members_admin_delete on public.department_members
  for delete to authenticated using ((select public.is_admin()));

-- The five department names were confirmed by the church. Descriptions and
-- member records remain blank until the church approves the details.
insert into public.departments
  (slug, name, sort_order, publication_status, published_at)
values
  ('choir', 'Choir', 1, 'published', now()),
  ('media', 'Media', 2, 'published', now()),
  ('pastors', 'Pastors', 3, 'published', now()),
  ('ushering', 'Ushering', 4, 'published', now()),
  ('intercessory', 'Intercessory', 5, 'published', now());

commit;
