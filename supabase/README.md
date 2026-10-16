# Supabase content foundation

This folder contains the local Supabase CLI configuration and versioned PostgreSQL migrations. It defines the content schema and access controls only; it does not contain church content, uploads, or remote-project credentials.

## Schema

- `resource_types` is the controlled catalogue of extensible resource kinds. The initial kinds are audio, video, book/e-book, document, and poster/image. Add future kinds through a migration. Type-specific fields live in relational detail tables with constraints and type checks rather than unchecked JSON.
- `resources` contains shared resource title, summary, description, slug, type, publication state, and timestamps. A record is public only after it is published and its `published_at` time has arrived.
- `sermon_details`, `audio_details`, `video_details`, `book_details`, and `document_details` hold fields that only apply to those kinds. Video and reading links must use HTTPS. Video hosting is external in this phase.
- `assets` stores file metadata and a private storage locator, never file bytes. `resource_assets` relates files to resources, labels their purpose, and stores per-file public-metadata and download permissions.
- `events` and `ministries` contain their content and publication state. They may refer to an asset for an event poster or ministry image. Event timestamps are stored with a timezone and limited to `Africa/Lagos`.
- `admin_users` is an initially empty allow-list keyed to Supabase Auth user IDs. No administrator account is created by this migration.

## Access-control assumptions

RLS is enabled for every application table. Anonymous and authenticated non-admin readers can select published resources, events, ministries, and type details only. Public asset metadata is limited to safe columns and assets connected to published content; storage bucket names, object paths, filenames, and file sizes are not selectable through the public API. No Storage bucket or object policy is created in this phase, so these migrations do not make stored files public or implement downloads.

Writes are granted to authenticated users at the SQL privilege layer but RLS permits them only when their Auth user ID appears in `admin_users`. The table has no client write policy, so an administrator cannot add themselves or another administrator through the public API. The allow-list must be provisioned later through a trusted administrative procedure. The same admin check applies to content mutations. Application-level authorization and file validation are still required in the later admin/upload phase.

Public signup is disabled in the local Auth configuration. The hosted Supabase project must also have signup disabled before administrator access is enabled. Do not expose a service-role key in browser code. Do not configure a production upload-size limit until the selected Supabase plan has been verified.

## Local workflow

Requirements: Node.js/npm and Docker Desktop running. These commands use the project-local CLI and only target the local stack:

```powershell
npx.cmd supabase start
npx.cmd supabase db reset
npx.cmd supabase db lint --local --fail-on error
npx.cmd supabase stop
```

`db reset` recreates the local database and applies every migration from scratch, so local database contents are deleted. The CLI may display local development keys when the stack starts; keep that output private and never copy those values into source files. No command above links to or applies migrations to a remote project. Do not use `--linked` or `db push` as part of local verification.

This repository has no SQL test framework yet. The local reset and database lint check migration reproducibility and schema/function errors; add focused RLS integration tests before connecting public pages or enabling administrator workflows.
