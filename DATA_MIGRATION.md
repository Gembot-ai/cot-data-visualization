# Data Migration to Railway

## Automatic Setup (First Deploy)

When you deploy to Railway, the app will automatically:

1. ✅ Create database schema (tables, indexes)
2. ✅ Initialize 37 markets
3. ⚠️ **NOT** load historical CoT data (you need to do this)

The app will start successfully with 0 CoT reports, but you'll want to load data.

---

## Option 1: Export Local Data & Import to Railway (Fastest - 2 minutes)

This is the **recommended** approach since you already have 61,204 reports locally.

### Step 1: Export Your Local Data

```bash
cd "/Users/charlie/Desktop/CoT Report Visualisation"

# Export only the CoT reports (markets are auto-created)
docker-compose exec -T postgres pg_dump \
  -U cot_user \
  -d cot_db \
  --data-only \
  --table=cot_reports \
  --no-owner \
  --no-privileges \
  > cot_data_export.sql

echo "✅ Exported $(grep -c 'COPY' cot_data_export.sql) batches of data"
```

This creates a `cot_data_export.sql` file (~20-50MB) with all your CoT reports.

### Step 2: Import to Railway

```bash
# Install Railway CLI if needed
npm install -g @railway/cli

# Login and link to your project
railway login
railway link

# Import data to PostgreSQL
railway run psql $DATABASE_URL < cot_data_export.sql
```

**Done!** Your Railway database now has all 61K+ reports from 2006-2025.

---

## Option 2: Fetch from CFTC API on Railway (Slower - 10 minutes)

Fetch data directly from CFTC API while running on Railway.

```bash
# Connect to Railway
railway login
railway link

# Run the fetch script
railway run npm run fetch-all --prefix cot-backend
```

This will:
- Fetch ~217,000 CFTC records
- Filter to your 37 tracked markets
- Insert ~61K reports (2006-2025)
- Takes about 10 minutes

---

## Option 3: Incremental Updates (Weekly)

Once you have initial data, fetch only the latest weekly reports:

```bash
railway run npm run fetch-data --prefix cot-backend
```

Or add a scheduled job in Railway (requires Redis):
- The app has BullMQ configured to auto-fetch every Friday at 8PM EST
- Just add a Redis service to your Railway project

---

## Verify Data After Import

```bash
# Connect to Railway PostgreSQL
railway run psql $DATABASE_URL

# Check data
SELECT COUNT(*) FROM cot_reports;
SELECT MIN(report_date), MAX(report_date) FROM cot_reports;

# Check reports by market
SELECT m.symbol, COUNT(*) as reports
FROM cot_reports r
JOIN markets m ON m.id = r.market_id
GROUP BY m.symbol
ORDER BY reports DESC
LIMIT 10;

# Exit
\q
```

Expected output:
```
 count
-------
 61204

    min     |    max
------------+------------
 2006-09-26 | 2025-12-09

 symbol | reports
--------+---------
 NG     |    8256
 6E     |    6429
 CL     |    4792
 ES     |    3538
 ...
```

---

## Troubleshooting

### Import Fails: "relation does not exist"

The schema wasn't created. Restart your Railway service to trigger auto-initialization:

```bash
railway up
```

### Import is Slow

Large imports can take 2-5 minutes. Be patient. You'll see progress:

```
COPY 1000
COPY 1000
COPY 1000
...
```

### Data Import Worked but Dashboard is Empty

Check environment variables:
- Make sure `DATABASE_URL` is set (Railway auto-injects this)
- Check `NODE_ENV=production`
- View logs: `railway logs`

---

## Quick Reference

| Task | Command |
|------|---------|
| Export local data | `docker-compose exec -T postgres pg_dump -U cot_user -d cot_db --data-only --table=cot_reports > export.sql` |
| Import to Railway | `railway run psql $DATABASE_URL < export.sql` |
| Fetch from CFTC | `railway run npm run fetch-all --prefix cot-backend` |
| Check record count | `railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM cot_reports"` |
| View logs | `railway logs --follow` |

---

## File Size Reference

- **Empty database:** 0 records, ~1MB
- **With schema + markets:** 37 markets, ~1MB
- **With full data:** 61,204 reports, ~150-200MB
- **SQL export file:** ~20-50MB compressed

---

**Recommended approach:** Use Option 1 (export/import) since you already have clean local data. It's faster and more reliable than fetching from CFTC API.
