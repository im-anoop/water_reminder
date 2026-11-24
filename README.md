# Hydrate PWA
Next.js / Tailwind 4 app with foreground countdown and independent recurring background Web Push schedule.

## Setup
1. Install Node.js 22+, run `npm install`.
2. Create a Supabase project and execute `schema.sql` in SQL Editor.
3. Run `npx web-push generate-vapid-keys`. Copy `.env.example` to `.env.local` and fill all values. Use a long random CRON_SECRET (e.g. `openssl rand -hex 32`). Never expose the service role or private VAPID key. Use a real contact email in VAPID_SUBJECT.
4. Run `npm run dev` for local UI testing. Deploy to Vercel with the same environment variables, using HTTPS. Redeploy after changing public VAPID key.
5. Configure an external scheduler (e.g. cron-job.org, subject to service limits) to GET `https://YOUR-DOMAIN/api/cron` every minute with custom header `Authorization: Bearer YOUR_CRON_SECRET`. Do not put the secret in the URL. Vercel Hobby cron is not suitable for minute-level schedules. Verify scheduler responses and logs.
6. iPhone (iOS 16.4+): Safari > Share > Add to Home Screen. Open the installed app. Android: Chrome > menu > Install app / Add to Home screen. Open Hydrate and enable background reminders. Set 1 minute for a test, lock the phone, and wait for the next scheduler tick. Then set your preferred interval.

## Behavior and limitations
The background schedule is separate from the local countdown; use one mode at a time. Stop background reminders using its Stop button. The background schedule repeats around the selected interval, with scheduler and network delays. It does not require the page to remain open, but requires connectivity and permission. Sound is controlled by OS notification settings, Focus and silent mode; custom sounds cannot be guaranteed. The app does not schedule offline native alarms. Expired subscriptions are removed on HTTP 404/410. Transient push failures are retried at the next regular interval. Scheduler claims rows before sending to reduce duplicates. The API is designed for personal use; before public launch add authentication, rate limiting, stronger subscription validation and monitoring. Clearing site data may lose the device token used to stop the schedule. The foreground hydration log remains local. No live deployment or end-to-end mobile test has been performed.
