# Quick Start Guide

Get the CoT Dashboard running in 5 minutes!

## Option 1: Automated Setup (Recommended)

```bash
# Run the setup script
./setup.sh
```

That's it! The script will:
1. ✅ Check for Docker
2. ✅ Create environment files
3. ✅ Start all services
4. ✅ Initialize the database
5. ✅ Set up all 40+ markets

Visit **http://localhost:3000** to see your dashboard!

## Option 2: Manual Setup

### Step 1: Environment Files

```bash
cp cot-backend/.env.example cot-backend/.env
cp cot-frontend/.env.example cot-frontend/.env
```

### Step 2: Start Services

```bash
docker-compose up -d
```

### Step 3: Initialize Database

Wait 10 seconds for PostgreSQL to start, then:

```bash
docker exec -i $(docker ps -qf "name=postgres") psql -U cot_user -d cot_db < cot-backend/src/database/schema.sql
```

### Step 4: Open Dashboard

Go to **http://localhost:3000**

## What You'll See

1. **Market Selector** - Choose from 40+ futures markets organized by category
2. **Stacked Bar Chart** - Visualize Commercial vs Non-Commercial positions over 52 weeks
3. **Metrics Panel** - Current week's key statistics and percentages

## First Steps

1. **Select a Market** - Click on GC (Gold), CL (Crude Oil), or ES (S&P 500)
2. **View Data** - The chart shows weekly positioning data
3. **Analyze Trends** - Look for extreme positions or trend changes

## Available Markets

- **Energy**: CL, NG, RB, HO
- **Metals**: GC, SI, HG, PL
- **Financials**: ES, NQ, ZB, ZN, ZF, ZT
- **Currencies**: 6E, 6J, 6B, 6A, 6C, 6S, DX
- **Ags**: ZC, ZS, ZW, KC, SB, CT, CC
- **Livestock**: LE, HE, GF
- **Crypto**: BTC

## API Examples

```bash
# Get latest Gold data
curl http://localhost:3001/api/v1/cot/GC

# Get all markets
curl http://localhost:3001/api/v1/markets

# Batch request
curl "http://localhost:3001/api/v1/cot/batch?markets=GC,SI,CL"
```

## Troubleshooting

### Dashboard shows "Loading..."
- Check if backend is running: `docker ps`
- View API logs: `docker-compose logs api`

### No data showing
- Database may not be initialized
- Run: `docker-compose restart api`

### Port conflicts
- Change ports in `docker-compose.yml`
- Frontend: 3000 → your port
- Backend: 3001 → your port

## Next Steps

1. **Fetch Real Data** - The platform is set up to fetch from CFTC API
2. **Customize** - Modify charts, add new markets, create alerts
3. **Deploy** - Use the Dockerfiles for production deployment

## Useful Commands

```bash
# View all logs
docker-compose logs -f

# Stop everything
docker-compose down

# Restart a service
docker-compose restart api

# Rebuild after code changes
docker-compose up -d --build
```

## Need Help?

- Check the [README.md](./README.md) for detailed documentation
- Review the [Technical Spec](./CoT-NodeJS-React-Spec.md)
- Open an issue on GitHub

Happy analyzing! 📊
