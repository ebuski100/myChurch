# M1 local runbook (local development only — never production)

> Do NOT run anything in this file until the M1 package has been reviewed
> and explicitly approved. Every command targets the LOCAL stack only.
> Never use `--linked`, `db push`, or any remote project reference.
> Never run any command below against production.
>
> DESTRUCTIVE-COMMAND WARNING: `supabase db reset` (section 2) DESTROYS the
> local database and recreates it from migrations. All local rows, local Auth
> users, and local Storage objects are deleted. It is not a harmless first
> test. Commands are grouped below into NON-DESTRUCTIVE (safe inspection)
> and DESTRUCTIVE (erases local data) — do not run a destructive command
> until its stated precondition is met.

## 0. Preconditions and safety rules

- Node.js/npm and Docker Desktop running.
- No linked remote work in progress (`supabase/.temp/linked-project.json`
  exists in this repo — that is expected; no command below uses it).
- Working tree clean for `supabase/` except the intended M1 files
  (verify with `git status --porcelain -- supabase`).
- Before ANY destructive command: either (a) work in a disposable local
  environment you can afford to lose, or (b) take and verify a backup of
  anything in the local database you need (`supabase db dump --local -f
  <backup-file>`, then confirm the file is non-empty and restorable). If the
  local database holds anything irreplaceable and you have no verified
  backup, STOP.
- Preferred first path: a disposable local Supabase environment (fresh
  `supabase start` on a machine/directory with no local data worth keeping),
  so `db reset` can run without risk to anything.

## 1. NON-DESTRUCTIVE: start stack and inspect (read-only)

These commands do not modify data:

```powershell
npx.cmd supabase start
npx.cmd supabase status        # record the direct DB URL (port 54322), NOT the pooler URL
git status --porcelain -- supabase   # confirm only the intended M1 files are present
```

## 2. DESTRUCTIVE: apply M1 via the normal reset path

Precondition: section 0 backup/disposable requirement satisfied.
This deletes and recreates the LOCAL database only. Never production.

The M1 migration itself is schema-only and deterministic: on a fresh clone
it adds columns/index/trigger and changes no row values.

```powershell
npx.cmd supabase db reset
npx.cmd supabase db lint --local --fail-on error
```

Expected: reset completes, lint passes, zero `PRIMARY_*` errors
(the migration contains no bootstrap logic and reads no operator input).

## 3. NON-DESTRUCTIVE: pgTAP guard tests (rolls back, net zero writes)

Precondition: section 2 completed on a disposable local database with an
EMPTY `public.admin_users` table (fresh reset, no bootstrap applied). Do NOT
run the test file on a database holding any local admin rows you need — the
file asserts an empty table as its first check and fails loudly otherwise,
but respect the precondition anyway.

Requires the pgTAP functions (`plan/ok/is/throws_ok/finish`) used by the
existing `rls_content_foundation.test.sql`. If the local database lacks the
pgtap extension, install it locally first (`create extension pgtap;` on the
scratch database only) or follow the fallback in §5.

```powershell
# replace <DIRECT-DB-URL> with the URL from `supabase status`
psql "<DIRECT-DB-URL>" -v ON_ERROR_STOP=1 -f supabase/tests/rls_primary_guard.test.sql
```

Expected: all 21 assertions pass, transaction rolls back (no rows left behind).
The `throws_ok` messages assert exact constraint text:
`admin_users_single_active_primary` (23505) and
`admin_users_active_needs_timestamp` (23514).
If Postgres reports a different detail string for either, STOP and record the
actual message — do not loosen the assertion without review.

## 4. NON-DESTRUCTIVE reads + short-lived test transactions: two-session concurrency

Follow `supabase/tests/concurrency_primary_guard.md` header comments case by
case, with two `psql` sessions on the direct DB URL (reads plus brief test
transactions that roll back; no bulk erasure):

```powershell
psql "<DIRECT-DB-URL>"   # session A
psql "<DIRECT-DB-URL>"   # session B (second terminal, same URL)
```

Cases: T1 promotion×2, T2 deactivation-vs-delete, T5 bypass attempts run on
the M1-only database. T3 (handover-vs-recovery) and the guard-dependent half
of T2/T4 are marked SKIP until guard activation is verified — record each SKIP
with its reason. For every executed case, verify the committed `admin_users`
rows (and `auth.users` where relevant) and confirm count(active primary) = 1
with the expected surviving id.

## 5. Fallback if pgTAP is unavailable

Run each assertion block of `rls_primary_guard.test.sql` manually in psql and
compare outputs by eye. At minimum verify:

```sql
select column_name, column_default from information_schema.columns
  where table_schema='public' and table_name='admin_users'
  order by ordinal_position;
select indexname from pg_indexes
  where schemaname='public' and tablename='admin_users'
  and indexname='admin_users_single_active_primary';
select tgname from pg_trigger
  where tgrelid='public.admin_users'::regclass;
```

Expected: `role/is_active/created_by/deactivated_at/deactivated_by` present,
unique index present, `admin_users_lock_primary_mutation` present,
`admin_users_must_retain_primary` absent, `recover_primary` absent.

## 6. Bootstrap + guard activation (ONLY after review approval)

These scripts are manual and NEVER run under `db reset`:

1. Fill in the verified `<TARGET_UUID>` (every occurrence) in
   `supabase/manual/bootstrap_primary.sql` from the out-of-band verified
   primary Auth id. Run Step 0 reads first; abort on any mismatch.
2. Run the write transaction; confirm Step 3 reads count=1, id=<TARGET>.
3. Run `supabase/manual/activate_primary_guard.sql`; confirm the trigger row,
   then the commented dry-run (staging/local) must fail with
   `PRIMARY_GUARD_ZERO` and leave the seat intact.

## 7. Stop

```powershell
npx.cmd supabase stop
```

## Assumptions awaiting verification

1. pgTAP availability on the local scratch database (existing tests assume it;
   no `create extension` found in-repo — confirm how they run here).
2. Exact Postgres error-detail strings for 23505/23514 on major version 17
   (asserted literally; first run confirms or corrects).
3. `auth.users` readability from the operator psql session (needed for Step 0).
4. Fixture Auth-user creation approach for concurrency tests on a scratch clone.
5. Whether guard activation ships as a second migration file with a blocking
   header vs. staying a manual script (your call).
