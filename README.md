# Commitment of Traders (CoT) Data Aggregator & Visualization Platform

A full-stack application for aggregating, analyzing, and visualizing CFTC Commitment of Traders reports. Built with Node.js, React 18, PostgreSQL (TimescaleDB), and Docker.

## Features

- 📊 **Interactive Dashboard** - Stacked bar charts showing Commercial, Non-Commercial, and Non-Reportable positions
- 🔄 **Real-time Data** - Fetch weekly CoT reports from official CFTC API
- 📈 **52-Week History** - View historical trends and position changes
- 🎯 **Multi-Market Support** - Track 40+ futures markets (Energy, Metals, Financials, Currencies, Agriculturals, Crypto)
- 💾 **Time-Series Database** - Optimized with TimescaleDB for efficient historical data queries
- 🎨 **Modern UI** - Responsive React dashboard with Tailwind CSS
- 🚀 **Production Ready** - Docker Compose for easy deployment

## Markets Covered

### Energy
- Crude Oil (CL), Natural Gas (NG), RBOB Gasoline (RB), Heating Oil (HO)

### Metals
- Gold (GC), Silver (SI), Copper (HG), Platinum (PL)

### Financials
- E-mini S&P 500 (ES), NASDAQ 100 (NQ), 30-Year T-Bond (ZB), 10-Year T-Note (ZN), and more

### Currencies
- Euro (6E), Japanese Yen (6J), British Pound (6B), US Dollar Index (DX)

### Agriculturals
- Corn (ZC), Soybeans (ZS), Wheat (ZW), Coffee (KC), Sugar (SB), Cotton (CT), Cocoa (CC)

### Livestock
- Live Cattle (LE), Lean Hogs (HE), Feeder Cattle (GF)

### Crypto
- Bitcoin Futures (BTC)

## Tech Stack

### Backend
- **Runtime:** Node.js 20+
- **Language:** TypeScript 5.3+
- **Web Framework:** Fastify
- **Database:** PostgreSQL 15 + TimescaleDB
- **Cache:** Redis 7+
- **Job Queue:** BullMQ (for scheduled CFTC data fetching)
- **API Docs:** OpenAPI/Swagger

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite 5
- **UI Library:** Tailwind CSS
- **State Management:** TanStack Query (React Query) + Zustand
- **Charts:** Recharts 2.10

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "CoT Report Visualisation"
```

### 2. Set Up Environment Variables

**Backend:**
```bash
cd cot-backend
cp .env.example .env
```

**Frontend:**
```bash
cd cot-frontend
cp .env.example .env
```

### 3. Start with Docker Compose

```bash
# From the project root
docker-compose up -d
```

This will start:
- PostgreSQL (TimescaleDB) on port 5432
- Redis on port 6379
- Backend API on port 3001
- Frontend on port 3000

### 4. Initialize the Database

```bash
# Connect to the running API container
docker exec -it cot-report-visualisation-api-1 sh

# Run the database initialization script
npm run init-db
```

Alternatively, run the schema manually:
```bash
docker exec -i cot-report-visualisation-postgres-1 psql -U cot_user -d cot_db < cot-backend/src/database/schema.sql
```

### 5. Access the Application

- **Frontend Dashboard:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **API Documentation:** http://localhost:3001/ (root shows available endpoints)
- **Health Check:** http://localhost:3001/health

## Local Development (Without Docker)

### Backend Setup

```bash
cd cot-backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Make sure PostgreSQL and Redis are running locally
# Update .env with your database credentials

# Initialize database
npm run init-db

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd cot-frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start development server
npm run dev
```

## API Endpoints

### Markets

- `GET /api/v1/markets` - List all markets
- `GET /api/v1/markets/:symbol` - Get market by symbol (e.g., GC, CL, ES)
- `GET /api/v1/markets/category/:category` - Get markets by category

### CoT Data

- `GET /api/v1/cot/:marketSymbol` - Latest CoT report for a market
- `GET /api/v1/cot/:marketSymbol/history` - Historical data (supports date range query params)
- `GET /api/v1/cot/batch?markets=GC,CL,ES` - Batch fetch multiple markets
- `GET /api/v1/cot/latest/all` - Latest data for all markets

### Example Requests

```bash
# Get latest Gold (GC) report
curl http://localhost:3001/api/v1/cot/GC

# Get historical data for Crude Oil (CL)
curl "http://localhost:3001/api/v1/cot/CL/history?start=2024-01-01T00:00:00Z&end=2024-12-31T00:00:00Z"

# Batch fetch
curl "http://localhost:3001/api/v1/cot/batch?markets=GC,SI,CL,NG"
```

## Database Schema

The application uses PostgreSQL with TimescaleDB for optimized time-series queries:

### Tables

1. **markets** - Market metadata (symbol, name, category, exchange)
2. **cot_reports** - Main CoT data (hypertable partitioned by publish_date)
3. **cot_metrics** - Computed metrics (net positions, percentages, sentiment)
4. **cot_trends** - Moving averages and trend indicators
5. **data_fetches** - Audit log for data fetching operations

## Data Flow

1. **BullMQ Job** triggers every Friday at 4 PM EST (configurable)
2. **DataFetcherService** calls CFTC API for latest reports
3. **DataTransformerService** normalizes data and calculates metrics
4. **Repository Layer** saves to PostgreSQL with upsert logic (no duplicates)
5. **REST API** serves data to React frontend
6. **React Query** caches responses and manages state

## Features Roadmap

### Implemented ✅
- [x] Backend API with Fastify
- [x] PostgreSQL + TimescaleDB schema
- [x] Market data initialization (40+ markets)
- [x] CoT data fetching service (CFTC API integration)
- [x] Data transformation and metrics calculation
- [x] REST API endpoints
- [x] React dashboard with Recharts
- [x] Market selector with category grouping
- [x] Stacked bar chart visualization
- [x] Metrics panel (latest report summary)
- [x] Docker Compose setup

### Coming Soon 🚧
- [ ] BullMQ job scheduler (weekly auto-fetch)
- [ ] Historical data backfill script
- [ ] Multi-market comparison view
- [ ] Export to CSV/PDF
- [ ] Dark mode toggle
- [ ] WebSocket real-time updates
- [ ] Advanced analytics (correlation matrix, divergences)
- [ ] Alert notifications (extreme positions)
- [ ] User authentication

## Project Structure

```
CoT Report Visualisation/
├── cot-backend/
│   ├── src/
│   │   ├── api/              # Routes, controllers, middlewares
│   │   ├── services/         # Business logic (fetcher, transformer)
│   │   ├── database/         # Schema, repositories
│   │   ├── jobs/             # BullMQ scheduled tasks
│   │   ├── config/           # Environment, DB, Redis config
│   │   ├── types/            # TypeScript interfaces
│   │   └── utils/            # Helpers, logger, constants
│   ├── Dockerfile
│   └── package.json
│
├── cot-frontend/
│   ├── src/
│   │   ├── api/              # API client, types
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Page components
│   │   └── utils/            # Frontend utilities
│   ├── Dockerfile
│   └── package.json
│
└── docker-compose.yml
```

## Troubleshooting

### Database connection issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View logs
docker logs cot-report-visualisation-postgres-1

# Test connection
docker exec -it cot-report-visualisation-postgres-1 psql -U cot_user -d cot_db
```

### API not starting

```bash
# Check API logs
docker logs cot-report-visualisation-api-1

# Restart API
docker-compose restart api
```

### Frontend build issues

```bash
cd cot-frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Data sourced from [CFTC (Commodity Futures Trading Commission)](https://www.cftc.gov/)
- Built with inspiration from the crowded market report methodology

## Support

For issues and questions:
- Open an issue on GitHub
- Check the [Technical Specification](./CoT-NodeJS-React-Spec.md) for detailed architecture

---

**Happy Trading Analysis!** 📊📈
