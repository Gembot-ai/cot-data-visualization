# Railway Cron Job Setup

To automatically update CoT data every week, you need to create a Cron Job in Railway.

## Steps:

1. **Go to Railway Dashboard**
   - Open your project: https://railway.app/project/[your-project-id]

2. **Create Cron Job**
   - Click **"+ New"** button
   - Select **"Cron Job"**

3. **Configure the Cron Job**
   - **Name:** `Weekly CoT Data Update`
   - **Schedule:** `0 20 * * 5` (Every Friday at 8 PM UTC)
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

`0 20 * * 5` means:
- `0` - At minute 0
- `20` - At hour 20 (8 PM UTC)
- `*` - Every day of month
- `*` - Every month
- `5` - On Friday (0=Sunday, 5=Friday)

**Note:** CFTC releases CoT reports every Friday around 3:30 PM ET (8:30 PM UTC), so running at 8 PM UTC should capture the latest data.

## Alternative Schedules

- **Every Friday at 9 PM UTC:** `0 21 * * 5`
- **Every Friday at 10 PM UTC:** `0 22 * * 5`
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
