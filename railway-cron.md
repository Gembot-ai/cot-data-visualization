# Railway Cron Job Setup

> **Note:** This is now OPTIONAL. The app has a built-in scheduler that
> automatically refreshes CoT data **daily** while the web service is running —
> no Railway cron job or manual `npm run weekly-update` required. It's wired up
> in `src/jobs/scheduler.ts` and starts with the server.
>
> Configure it with env vars (see `.env.example`):
> - `DATA_FETCH_CRON` — cron expression in UTC (default `0 21 * * *`, daily at 21:00 UTC)
> - `ENABLE_SCHEDULER` — `true`/`false` (defaults to `true` in production)
>
> The instructions below are only needed if you prefer to run the update as a
> separate Railway cron job instead of (or in addition to) the in-app scheduler.

## Steps:

1. **Go to Railway Dashboard**
   - Open your project: https://railway.app/project/[your-project-id]

2. **Create Cron Job**
   - Click **"+ New"** button
   - Select **"Cron Job"**

3. **Configure the Cron Job**
   - **Name:** `Weekly CoT Data Update`
   - **Schedule:** `0 22 * * 5` (Every Friday at 10 PM UTC = Saturday 11 AM NZDT)
   - **Command:** `npm run weekly-update`
   - **Service:** Select your main service (the one with the database connection)

4. **Environment Variables**
   The cron job will automatically inherit all environment variables from your service:
   - `DATABASE_URL`
   - `NODE_ENV`
   - All other vars

5. **Deploy**
   - Click **"Create"**
   - The cron will run automatically every Friday

## Schedule Explanation

`0 22 * * 5` means:
- `0` - At minute 0
- `22` - At hour 22 (10 PM UTC)
- `*` - Every day of month
- `*` - Every month
- `5` - On Friday (0=Sunday, 5=Friday)

**Timing Breakdown:**
- CFTC releases CoT reports: **Friday 3:30 PM ET** (8:30 PM UTC)
- In New Zealand (NZDT UTC+13): **Saturday 9:30 AM**
- Cron runs: **Friday 10 PM UTC** = **Saturday 11:00 AM NZDT**
- Buffer: 1.5 hours after release to ensure data is fully available

## Alternative Schedules

- **Earlier (Saturday 10 AM NZDT):** `0 21 * * 5`
- **Later (Saturday 12 PM NZDT):** `0 23 * * 5`
- **Daily at midnight UTC:** `0 0 * * *`

## Testing the Cron

To manually trigger the cron job for testing:
1. Go to the Cron Job in Railway
2. Click **"Run Now"**
3. Check logs to verify it works

## Monitoring

- View cron execution logs in Railway dashboard
- Each run will show:
  - Current data count
  - New reports added
  - Completion status
