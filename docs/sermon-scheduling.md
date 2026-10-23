# Sermon publishing schedule

Scheduled sermons are stored with `publication_status = 'scheduled'` and their target time in `resources.published_at`. Admin-entered wall times use `Africa/Lagos` (WAT, UTC+01:00). Drafts and scheduled sermons are excluded from public RLS reads and the audio authorization route. When due, the scheduler changes the row to `published` and stamps `published_at` with server time.

## Required deployment setup

The repository has no configured deployment scheduler. Automatic publication is therefore unavailable until the deployment owner configures both of these items:

1. Set the server-only environment variable `SERMON_SCHEDULER_SECRET` to a long, random value in the application deployment. Do not use a `NEXT_PUBLIC_` variable or commit the value.
2. Configure an external HTTP scheduler to request `GET https://<your-site>/api/cron/sermon-publication` at least once per minute and send `Authorization: Bearer <SERMON_SCHEDULER_SECRET>` over HTTPS. Store the header value in the scheduler's secret store.

The endpoint processes at most 100 due sermons per request, checks the required sermon records, private audio link, private bucket locator, and object existence, and updates each row only while its current status and scheduled timestamp still match. Repeated and concurrent requests are safe to retry; one request wins each status transition. The endpoint returns only aggregate counts.

This repository does not configure a provider cron job or deploy the endpoint. Scheduling a sermon locally or in production does not guarantee automatic publication until that external trigger and secret are configured and verified.
