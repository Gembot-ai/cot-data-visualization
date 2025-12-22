# Quick Reference Card

## 🚀 Deploy to Railway (5 Minutes)

### Prerequisites
- GitHub account
- Railway account (free tier available)

### Steps

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/cot-viz.git
   git push -u origin main
   ```

2. **Deploy on Railway**
   - Go to [railway.app/new](https://railway.app/new)
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add PostgreSQL**
   - Click **+ New** → **PostgreSQL**
   - Railway auto-injects `DATABASE_URL`

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   JWT_SECRET=<run: openssl rand -base64 32>
   ```

5. **Initialize Database**
   ```bash
   railway run npm run init-db --prefix cot-backend
   railway run npm run fetch-all --prefix cot-backend
   ```

**Done!** Visit your app at `https://your-app.up.railway.app`

---

## 💻 Local Development

### Start
```bash
docker-compose up -d
```

### Access
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- API Docs: http://localhost:3001/

### Stop
```bash
docker-compose down
```

### Rebuild
```bash
docker-compose up -d --build
```

---

## 📊 Database Commands

### View Data
```bash
# Via Docker
docker-compose exec postgres psql -U cot_user -d cot_db

# Via Railway
railway connect postgres
```

### Export Data
```bash
# Local
docker-compose exec -T postgres pg_dump -U cot_user -d cot_db > backup.sql

# Railway
railway connect postgres --dump > backup.sql
```

### Import Data
```bash
# Local
docker-compose exec -T postgres psql -U cot_user -d cot_db < backup.sql

# Railway
railway connect postgres < backup.sql
```

---

## 🔧 Useful Commands

### Fetch Latest CoT Data
```bash
# Local
docker-compose exec api npm run fetch-data

# Railway
railway run npm run fetch-data --prefix cot-backend
```

### Fetch All Historical Data
```bash
# Local (takes ~10 min)
cd cot-backend && npm run fetch-all

# Railway
railway run npm run fetch-all --prefix cot-backend
```

### View Logs
```bash
# Local
docker-compose logs -f api
docker-compose logs -f frontend

# Railway
railway logs
railway logs --follow
```

### Database Queries
```sql
-- Count reports
SELECT COUNT(*) FROM cot_reports;

-- Date range
SELECT MIN(report_date), MAX(report_date) FROM cot_reports;

-- Reports by market
SELECT m.symbol, COUNT(*) as reports
FROM cot_reports r
JOIN markets m ON m.id = r.market_id
GROUP BY m.symbol
ORDER BY reports DESC;

-- Latest Gold (GC) data
SELECT *
FROM cot_reports r
JOIN markets m ON m.id = r.market_id
WHERE m.symbol = 'GC'
ORDER BY report_date DESC
LIMIT 1;
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 3000/3001
lsof -ti:3000 | xargs kill
lsof -ti:3001 | xargs kill
```

### Docker Issues
```bash
# Reset everything
docker-compose down -v
docker-compose up -d --build
```

### Database Not Connecting
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart database
docker-compose restart postgres
```

### Railway Build Fails
```bash
# Clear cache
railway service delete-cache

# Redeploy
git commit --allow-empty -m "Trigger rebuild"
git push
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `.env.example` | Environment variables template |
| `docker-compose.yml` | Local development setup |
| `railway.json` | Railway deployment config |
| `RAILWAY_DEPLOYMENT.md` | Complete deployment guide |
| `cot-backend/src/database/schema.sql` | Database schema |

---

## 🔗 Key URLs

### Local
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health: http://localhost:3001/health
- Markets: http://localhost:3001/api/v1/markets

### Production (Railway)
- App: https://your-app.up.railway.app
- Health: https://your-app.up.railway.app/health
- API: https://your-app.up.railway.app/api/v1

---

## 📦 Tech Stack

- **Backend:** Node.js 20, TypeScript, Fastify
- **Frontend:** React 18, Vite, Tailwind CSS
- **Database:** PostgreSQL 15 + TimescaleDB
- **Cache:** Redis 7 (optional)
- **Charts:** Chart.js, Recharts
- **Deployment:** Railway, Docker

---

## 📈 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/markets` | List all markets |
| `GET /api/v1/cot/:symbol` | Latest report for market |
| `GET /api/v1/cot/:symbol/history` | Historical data |
| `GET /api/v1/cot/batch?markets=GC,CL` | Multiple markets |

### Example Requests
```bash
# Get all markets
curl http://localhost:3001/api/v1/markets

# Get latest Gold data
curl http://localhost:3001/api/v1/cot/GC

# Get historical data
curl "http://localhost:3001/api/v1/cot/GC/history?start=2024-01-01&end=2024-12-31"

# Batch request
curl "http://localhost:3001/api/v1/cot/batch?markets=GC,SI,CL"
```

---

## 🎨 Environment Variables

### Required
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
NODE_ENV=production
JWT_SECRET=<random-string>
```

### Optional
```bash
PORT=3001                    # Auto-set by Railway
FRONTEND_URL=https://...     # For CORS
REDIS_URL=redis://...        # For job scheduling
WEEKLY_FETCH_CRON=0 20 * * FRI
```

---

**Need help?** Check [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed guide.
