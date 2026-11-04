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
The reset applies every file in `supabase/migrations/` in filename order,
including `20261101000300_admin_is_admin_active.sql` (the F1 fix to
`public.is_admin()`); that file is schema-only and changes no row values.

## 3. NON-DESTRUCTIVE: pgTAP guard and is_admin tests (rolls back, net zero writes)

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

### 3a. is_admin() requires is_active (F1)

Migration `20261101000300_admin_is_admin_active.sql` replaces
`public.is_admin()` so it returns true only for an ENROLLED and ACTIVE
administrator. Before it, every content write policy accepted a deactivated
administrator's still-valid JWT through PostgREST, even though the application
already refused them. Same disposable, empty-`admin_users` database as above.

```powershell
psql "<DIRECT-DB-URL>" -v ON_ERROR_STOP=1 -f supabase/tests/rls_is_admin_active.test.sql
```

Expected: all 10 assertions pass, transaction rolls back. The suite proves
`is_admin()` is still SECURITY DEFINER with a pinned `search_path` and unchanged
grants, that an active administrator is still recognised, that a deactivated
administrator and a non-administrator are not, and — on `resources`, as the
representative content table — that a deactivated administrator's INSERT now
fails with `42501` (`new row violates row-level security policy for table
"resources"`) while an active administrator's INSERT still succeeds.
If Postgres words the RLS violation differently, STOP and record the actual
message — do not loosen the assertion without review.

## 4. NON-DESTRUCTIVE: pgTAP primary-transfer tests — RPC, candidate list, audit read (rolls back, net zero writes)

Precondition: section 2 completed on a disposable local database with an
EMPTY `public.admin_users` table (fresh reset, no bootstrap applied). Same
requirement and same reason as section 3 — the suite asserts absolute seat
counts and its first assertion fails loudly on a populated table.

Requires the same pgTAP functions as section 3.

```powershell
# replace <DIRECT-DB-URL> with the URL from `supabase status`
psql "<DIRECT-DB-URL>" -v ON_ERROR_STOP=1 -f supabase/tests/rls_primary_transfer.test.sql
```

Expected: all 36 assertions pass, transaction rolls back (no rows left behind).
The `throws_ok` messages assert exact `P0001` text:
`PRIMARY_TRANSFER_UNAUTHENTICATED`, `PRIMARY_TRANSFER_INVALID_TARGET`,
`PRIMARY_TRANSFER_NOT_PRIMARY`, `PRIMARY_TRANSFER_SELF`,
`PRIMARY_TRANSFER_TARGET_NOT_ADMIN`, `PRIMARY_TRANSFER_TARGET_INACTIVE`.
If Postgres reports different text for any of them, STOP and record the actual
message — do not loosen the assertion without review.

The suite also asserts that `authenticated` still holds NO insert/update/delete
privilege on `admin_users` and NO write privilege at all on
`admin_primary_transfers`: the transfer RPC is the only write path.

### 4a. Read-side authorization: candidate list + audit trail (G1, G2)

The write suite above does not cover the two READ surfaces. This file does.
Same disposable, empty-`admin_users` database.

```powershell
psql "<DIRECT-DB-URL>" -v ON_ERROR_STOP=1 -f supabase/tests/rls_primary_transfer_read.test.sql
```

Expected: all 20 assertions pass, transaction rolls back.

**Documented access model** (asserted, not invented by the test):

- `list_primary_transfer_candidates()` answers only an ACTIVE PRIMARY. It
  returns active standard administrators and nothing else — never a
  deactivated account, never another primary. Every other caller — active
  standard administrator, deactivated administrator, deactivated primary,
  authenticated non-administrator, or a caller with no JWT subject — receives
  ZERO ROWS rather than an error, so the function reveals nothing about the
  seat. `anon` holds no EXECUTE at all.
- `admin_primary_transfers` is readable by ANY ACTIVE administrator. A
  STANDARD administrator reading the history is INTENDED (see the policy
  comment in `20261101000100_admin_primary_transfer.sql` and
  `src/lib/admin-primary-data.ts`); the suite pins that behaviour so a future
  tightening is a deliberate, visible change. Deactivated administrators and
  non-administrators read zero rows; `anon` holds no SELECT at all.

`anon` is asserted through `has_function_privilege` / `has_table_privilege`
rather than by switching role: `anon` also lacks EXECUTE on the pgTAP
functions, so a role switch would fail on the assertion call instead of the
statement under test.

## 5. NON-DESTRUCTIVE reads + short-lived test transactions: two-session concurrency

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

Then repeat the same two-session procedure for the transfer RPC, following
`supabase/tests/concurrency_primary_transfer.md` header comments case by case:
T1 competing transfers (S1 wins, S2 fenced with `PRIMARY_TRANSFER_NOT_PRIMARY`),
T5 target-deactivated-while-transferring, and — once the guard is active —
T2 demotion-vs-transfer, T3 Auth-cascade-vs-transfer and T4 bootstrap-vs-transfer.
Record every SKIP with its reason, and after each case confirm
count(active primary) = 1 and the audit row count matches the number of
successful transfers. A `40P01` deadlock is a retryable outcome, not a failed
transfer — see the KNOWN LIMITATION note in that file.

## 6. Fallback if pgTAP is unavailable

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

select p.proname, p.prosecdef, p.proconfig from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname='public' and p.proname='transfer_primary_admin';
select prosrc from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname='public' and p.proname='is_admin';   -- must contain "and au.is_active"
select count(*) from public.admin_primary_transfers;
```

Expected: `role/is_active/created_by/deactivated_at/deactivated_by` present,
unique index present, `admin_users_lock_primary_mutation` present,
`admin_users_must_retain_primary` absent, `recover_primary` absent,
`transfer_primary_admin` present with `prosecdef = true` and a `search_path`
entry in `proconfig`, `is_admin` present with `prosecdef = true`, a
`search_path` entry and `au.is_active` in its source, and the audit table
present (row count 0 on a fresh reset, non-zero only after a real transfer).

## 7. Bootstrap + guard activation (ONLY after review approval)

These scripts are manual and NEVER run under `db reset`:

1. Fill in the verified `<TARGET_UUID>` (every occurrence) in
   `supabase/manual/bootstrap_primary.sql` from the out-of-band verified
   primary Auth id. Run Step 0 reads first; abort on any mismatch.
2. Run the write transaction; confirm Step 3 reads count=1, id=<TARGET>.
3. Run `supabase/manual/activate_primary_guard.sql`; confirm the trigger row,
   then the commented dry-run (staging/local) must fail with
   `PRIMARY_GUARD_ZERO` and leave the seat intact.

## 8. Primary transfer (runtime procedure — approved environments only)

`public.transfer_primary_admin(p_target_user_id uuid)` is the ONLY sanctioned
way to move the primary seat. Do not hand-write a demote/promote pair: this RPC
is the single path that enforces the caller check, the target checks, the
advisory lock, and the audit row.

Preconditions:

- Bootstrap and guard activation (section 7) are complete and verified.
- The caller is signed in as the CURRENT active primary.
- The target is an ACTIVE STANDARD administrator. Enrol the target first; the
  RPC refuses a non-administrator and refuses a deactivated account.
- The target is not the caller.

Application path (the real one): sign in as the current primary and open
`/admin/primary-transfer`. The screen lists eligible administrators
(`list_primary_transfer_candidates`), asks for an explicit confirmation, calls
`supabase.rpc('transfer_primary_admin', { p_target_user_id: '<TARGET_UUID>' })`
from a server action, and shows the recent audit rows below the form. On
success it returns to `/admin` with a notice — the caller is a standard
administrator by then, so the transfer screen is no longer open to them.

No service-role key is involved — the caller's own JWT is what authorizes the
transfer, and `auth.uid()` is re-checked inside the function. A standard
administrator who opens the screen directly sees a restricted panel, never the
candidate list.

Operator path (LOCAL ONLY — never production). An operator psql session has no
JWT, so `auth.uid()` is null and every call fails with
`PRIMARY_TRANSFER_UNAUTHENTICATED`. Impersonate the current primary for ONE
transaction only:

```sql
begin;
select set_config('request.jwt.claims',
  '{"sub":"<CURRENT_PRIMARY_UUID>","role":"authenticated"}', true);
select * from public.transfer_primary_admin('<TARGET_UUID>'::uuid);
commit;
```

On a hosted project use the application path instead, so the audit row records
a real signed-in caller rather than an operator impersonation.

Expected result: exactly one row returned with `transfer_id`,
`previous_primary_id`, `new_primary_id`, `transferred_at`, and no exception.

Verify immediately (read-only):

```sql
select count(*) filter (where role='primary' and is_active) as active_primaries,
       max(user_id) filter (where role='primary' and is_active) as primary_id
  from public.admin_users;            -- expect 1 and <TARGET_UUID>

select user_id, role, is_active from public.admin_users order by user_id;
-- expect: former primary = standard/true (STILL ACTIVE),
--         target         = primary/true

select previous_primary_id, new_primary_id, initiated_by_id, transferred_at
  from public.admin_primary_transfers
  order by transferred_at desc limit 1;   -- expect the transfer just made
```

Rejection codes. Each one aborts the whole transaction: no seat change, no
audit row.

| Code | Meaning |
| --- | --- |
| `PRIMARY_TRANSFER_UNAUTHENTICATED` | No JWT subject; caller identity unknown. |
| `PRIMARY_TRANSFER_INVALID_TARGET` | Target id was null. |
| `PRIMARY_TRANSFER_NO_ACTIVE_PRIMARY` | Seat is empty; use recovery (§9). |
| `PRIMARY_TRANSFER_NOT_PRIMARY` | Caller is not the current active primary (includes standard admins and a former primary after a completed transfer). |
| `PRIMARY_TRANSFER_SELF` | Target is the caller. |
| `PRIMARY_TRANSFER_TARGET_NOT_ADMIN` | Target has no `admin_users` row. |
| `PRIMARY_TRANSFER_TARGET_NOT_STANDARD` | Target is not a standard administrator. |
| `PRIMARY_TRANSFER_TARGET_INACTIVE` | Target is deactivated. |
| `PRIMARY_TRANSFER_INVARIANT` | Internal invariant check failed; nothing was written. Treat as a defect. |

After a successful transfer the CALLER is no longer primary. Every further
transfer must be initiated by the new primary.

## 9. Recovery considerations

`recover_primary()` is M5 and does not exist yet (section 6 verifies its
absence). Nothing in this section is sanctioned until M5 is reviewed.

1. **Primary account still usable** — use section 8. It is the only supported
   path and the only one that writes an audit row.

2. **Primary account exists but cannot sign in** — the seat is still held, so
   no transfer can be initiated, and the guard refuses any attempt to demote or
   delete the last primary. Fix the Auth account (password reset, MFA reset).
   Do NOT hand-edit `admin_users` to move the seat.

3. **Primary Auth account is being deleted** — with the guard active the
   deletion transaction is rejected at COMMIT with `PRIMARY_GUARD_ZERO` and the
   seat survives. If a deletion somehow succeeded on a pre-guard database the
   seat is empty, and NOTHING can initiate a transfer
   (`PRIMARY_TRANSFER_NO_ACTIVE_PRIMARY`). Recovery is the M5 `recover_primary()`
   path. Re-running `bootstrap_primary.sql` is NOT valid on a populated table —
   it refuses with `BOOTSTRAP_TARGET_NOT_ENROLLED` /
   `BOOTSTRAP_ACTIVE_PRIMARY_EXISTS`. Do not force it.

4. **Transfer went to the wrong target** — the transfer is already audited and
   the recipient now holds the seat. The recipient transfers it back with
   section 8. Never delete or edit the audit row; it is the record of what
   happened.

5. **Auth offboarding of a former primary** — `admin_primary_transfers`
   deliberately has no foreign key to `auth.users`, so deleting that account
   neither deletes nor rewrites the audit row. The recorded UUIDs are the
   historical identifiers; a missing `auth.users` row does not mean a missing
   audit entry.

6. **Guard not yet activated** — at-most-one is still guaranteed by
   `admin_users_single_active_primary`, but at-least-one is not. Do not use a
   hand-written demote/promote pair in that state; use section 8, which demotes
   and promotes inside one transaction.

7. **Partial failure is not possible by design** — the seat changes and the
   audit insert share one transaction. A crash or error before COMMIT leaves
   both untouched; there is no state in which the seat moved without an audit
   row or an audit row exists without the seat having moved.

## 10. Stop

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
6. Exact `P0001` message text for the nine `PRIMARY_TRANSFER_*` codes on major
   version 17 (asserted literally by section 4; the first run confirms or
   corrects).
7. How `set search_path = ''` renders in `pg_proc.proconfig` on major version 17.
   Section 4 asserts only a `search_path=` prefix for this reason; tighten to an
   exact match once the first run shows the exact string.
8. Whether the operator `set_config('request.jwt.claims', ...)` impersonation in
   section 8 is acceptable on the local stack, or whether the operator path
   should be dropped in favour of the application path only.
9. Whether `auth.uid()` in this project reads `request.jwt.claims` (the
   PostgREST shape) or the legacy `request.jwt.claim.sub` first. Both are
   covered by the standard Supabase definition; section 4 sets the
   `request.jwt.claims` form.
10. Exact wording of the RLS violation raised by an INSERT that fails
    `with check`: section 3a asserts `42501` with
    `new row violates row-level security policy for table "resources"`. The
    first run confirms or corrects the string; the errcode is the part that
    must not change.
