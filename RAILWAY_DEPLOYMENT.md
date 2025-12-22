# Railway Deployment Guide

This guide will walk you through deploying the CoT Data Visualization Platform to Railway with PostgreSQL.

## Prerequisites

- Railway account ([railway.app](https://railway.app))
- GitHub account
- Git installed locally

## Architecture on Railway

```
┌─────────────────────────────────────┐
│         Railway Project             │
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │  PostgreSQL  │  │   Backend   │ │
│  │   Service    │◄─┤  + Frontend │ │
│  │              │  │   (Node.js) │ │
│  └──────────────┘  └─────────────┘ │
│         ▲                 │         │
│         │                 │         │
│         └─────────────────┘         │
└─────────────────────────────────────┘
```

## Step 1: Prepare Your Local Repository

### 1.1 Initialize Git Repository

```bash
cd "CoT Report Visualisation"

# Initialize git if not already done
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: CoT Data Visualization Platform"
```

### 1.2 Create GitHub Repository

1. Go to [github.com](https://github.com) and create a new repository
2. Name it: `cot-data-visualization` (or your preferred name)
3. **Do NOT initialize with README** (we already have one)

### 1.3 Push to GitHub

```bash
# Add remote
git remote add origin https://github.com/YOUR_USERNAME/cot-data-visualization.git

# Push code
git branch -M main
git push -u origin main
```

## Step 2: Set Up Railway Project

### 2.1 Create New Project

1. Go to [railway.app/new](https://railway.app/new)
2. Click **"Deploy from GitHub repo"**
3. Select your `cot-data-visualization` repository
4. Railway will create a new project

### 2.2 Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will provision a PostgreSQL database
4. It will automatically inject `DATABASE_URL` into your backend service

### 2.3 Configure Environment Variables

Go to your backend service settings and add these variables:

```bash
# Required
NODE_ENV=production
JWT_SECRET=<generate-random-32-char-string>

# Optional (Railway auto-provides DATABASE_URL and PORT)
FRONTEND_URL=https://your-app.up.railway.app
CFTC_API_BASE=https://publicreporting.cftc.gov/api/
WEEKLY_FETCH_CRON=0 20 * * FRI
```

**Generate JWT Secret:**
```bash
# On Mac/Linux
openssl rand -base64 32

# Or use online generator
# https://generate-secret.vercel.app/32
```

## Step 3: Configure Build Settings

Railway should auto-detect the setup from `nixpacks.toml`, but verify:

### Build Command
```bash
cd cot-backend && npm ci && npm run build && cd ../cot-frontend && npm ci && npm run build
```

### Start Command
```bash
cd cot-backend && node dist/server.js
```

### Root Directory
```
/
```

## Step 4: Initialize Database Schema

After the first deployment succeeds:

### 4.1 Connect to Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link
```

### 4.2 Run Database Initialization

```bash
# Connect to your Railway PostgreSQL
railway run bash

# Inside the Railway shell
cd cot-backend
npm run init-db
```

**Alternative: Use Railway's PostgreSQL Plugin UI**

1. Go to your PostgreSQL service
2. Click **"Data"** tab
3. Run the schema SQL directly from `cot-backend/src/database/schema.sql`

## Step 5: Load Historical Data

### Option A: Fetch from CFTC API (Recommended)

```bash
# Via Railway CLI
railway run bash

cd cot-backend
npm run fetch-all
# This will fetch ~61,000 reports from 2006-2025
# Takes ~10-15 minutes
```

### Option B: Export from Local and Import

If you have local data already:

```bash
# On your local machine, export data
docker-compose exec -T postgres pg_dump -U cot_user -d cot_db \
  --data-only \
  --table=markets \
  --table=cot_reports \
  > cot_data_backup.sql

# Upload to Railway PostgreSQL
railway connect postgres < cot_data_backup.sql
```

## Step 6: Verify Deployment

### 6.1 Check Service Health

Visit: `https://your-app.up.railway.app/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

### 6.2 Test API Endpoints

```bash
# List markets
curl https://your-app.up.railway.app/api/v1/markets

# Get latest Gold data
curl https://your-app.up.railway.app/api/v1/cot/GC
```

### 6.3 Test Frontend

Visit: `https://your-app.up.railway.app`

You should see the dashboard with market selector and charts.

## Step 7: Set Up Custom Domain (Optional)

1. In Railway project settings, go to **"Settings"** → **"Domains"**
2. Click **"Generate Domain"** for a `*.up.railway.app` subdomain
3. Or add your custom domain and configure DNS

## Environment Variables Reference

### Railway Auto-Injected
```bash
DATABASE_URL       # PostgreSQL connection string
PORT              # Service port (usually 3000-9000)
RAILWAY_ENVIRONMENT # production/staging
```

### Required
```bash
NODE_ENV=production
JWT_SECRET=<your-secret>
```

### Optional
```bash
FRONTEND_URL=https://your-app.up.railway.app
CFTC_API_BASE=https://publicreporting.cftc.gov/api/
WEEKLY_FETCH_CRON=0 20 * * FRI
REDIS_URL=<if-using-redis-addon>
```

## Troubleshooting

### Build Fails

**Issue:** `npm ci` fails
```bash
# Solution: Clear build cache
railway service delete-cache
git push  # Trigger rebuild
```

**Issue:** TypeScript compilation errors
```bash
# Fix locally first
cd cot-frontend
npm run build

cd ../cot-backend
npm run build

# Then commit and push
```

### Database Connection Issues

**Issue:** `DATABASE_URL` not found
```bash
# Verify PostgreSQL is added
railway services  # Should show postgres service

# Manually set if needed (get URL from postgres service variables)
railway variables set DATABASE_URL=postgresql://...
```

### Data Not Showing

**Issue:** No data in dashboard
```bash
# Check if markets are initialized
railway connect postgres
\dt  # List tables
SELECT COUNT(*) FROM markets;
SELECT COUNT(*) FROM cot_reports;

# If empty, run init-db
railway run npm run init-db --prefix cot-backend
railway run npm run fetch-all --prefix cot-backend
```

### App Crashes on Start

**Issue:** Server won't start
```bash
# Check logs
railway logs

# Common issues:
# 1. Missing NODE_ENV=production
# 2. Invalid DATABASE_URL
# 3. Port binding (Railway auto-sets PORT, don't override)
```

## Cost Estimates

Railway pricing (as of 2024):

- **Hobby Plan:** $5/month
  - Includes: 500 execution hours
  - PostgreSQL: Included
  - Bandwidth: 100GB/month
  - Storage: 5GB

- **Pro Plan:** $20/month
  - Includes: Unlimited execution hours
  - Better resources
  - Priority support

**Estimate for this project:**
- Small traffic: Hobby plan sufficient
- Medium traffic (1000+ users/day): Pro plan recommended

## Monitoring

### View Logs
```bash
railway logs
railway logs --follow  # Tail logs
```

### Metrics
- CPU, Memory, Network usage visible in Railway dashboard
- Set up alerts in Railway settings

## Scheduled Jobs (Weekly Data Fetch)

The app includes a BullMQ job scheduler that fetches new CoT data every Friday at 8 PM EST.

**Requirements:**
- Redis service needed for job queue
- Add Redis on Railway: **"+ New"** → **"Database"** → **"Redis"**
- Railway will auto-inject `REDIS_URL`

## Backup Strategy

### Automated Backups
Railway PostgreSQL includes daily automated backups (last 7 days).

### Manual Backup
```bash
# Create backup
railway connect postgres --dump > cot_backup_$(date +%Y%m%d).sql

# Restore from backup
railway connect postgres < cot_backup_20240101.sql
```

## Performance Optimization

### 1. Database Indexing
Already included in schema:
- Indexes on `market_id`, `report_date`, `publish_date`
- Composite indexes for common queries

### 2. Connection Pooling
Fastify uses `pg` with default pooling.

### 3. Caching
Consider adding Redis for:
- API response caching
- Session storage
- Job queue (BullMQ)

## Continuous Deployment

Every `git push` to `main` branch triggers:
1. Automatic rebuild on Railway
2. Zero-downtime deployment
3. Rollback available if deployment fails

## Security Best Practices

1. ✅ **Environment Variables:** Never commit `.env` files
2. ✅ **JWT Secret:** Use strong random string
3. ✅ **Database:** Railway PostgreSQL is SSL-enabled
4. ✅ **CORS:** Configured to allow only your frontend URL
5. ⚠️ **API Rate Limiting:** Consider adding rate limiting middleware

## Next Steps

1. **Set up monitoring:** Add error tracking (e.g., Sentry)
2. **Add analytics:** Track usage patterns
3. **Enable Redis:** For job scheduling and caching
4. **Custom domain:** Configure your own domain
5. **CI/CD:** Add GitHub Actions for tests before deploy

## Support

- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Railway Community: [discord.gg/railway](https://discord.gg/railway)
- Project Issues: GitHub Issues in your repo

---

**Deployment Checklist:**

- [ ] Git repository initialized
- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] PostgreSQL service added
- [ ] Environment variables configured
- [ ] Build and start commands verified
- [ ] Database schema initialized
- [ ] Historical data loaded
- [ ] Health check passes
- [ ] Frontend accessible
- [ ] API endpoints working
- [ ] (Optional) Redis added for scheduled jobs
- [ ] (Optional) Custom domain configured

**Happy deploying! 🚀**
