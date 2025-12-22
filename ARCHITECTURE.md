# System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                     http://localhost:3000                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      REACT FRONTEND                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Dashboard   │  │    Market    │  │   Stacked    │          │
│  │    Page      │─▶│   Selector   │  │  Bar Chart   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│          │                                     ▲                 │
│          │         ┌──────────────┐           │                 │
│          └────────▶│ React Query  │───────────┘                 │
│                    │   + Zustand  │                             │
│                    └──────┬───────┘                             │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FASTIFY API SERVER                            │
│                   http://localhost:3001                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      Routes Layer                         │  │
│  │  /api/v1/markets     /api/v1/cot/:symbol               │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │                  Controllers Layer                        │  │
│  │    MarketsController        CotController                │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │                   Services Layer                          │  │
│  │  DataFetcherService    DataTransformerService           │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │                 Repository Layer                          │  │
│  │  MarketsRepo          CotReportsRepo                     │  │
│  └────────────────────────┬─────────────────────────────────┘  │
└───────────────────────────┼─────────────────────────────────────┘
                            │ SQL
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              POSTGRESQL + TIMESCALEDB                            │
│                   localhost:5432                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ markets  │  │   cot_   │  │   cot_   │  │   data_  │       │
│  │          │  │ reports  │  │ metrics  │  │ fetches  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘

                            ▲
                            │ Scheduled Jobs
┌───────────────────────────┼─────────────────────────────────────┐
│                      BULLMQ + REDIS                              │
│                     localhost:6379                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Weekly CoT Fetch Job (Every Friday 4 PM EST)           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

                            ▲
                            │ Fetch Data
┌───────────────────────────┼─────────────────────────────────────┐
│                       CFTC API                                   │
│        https://publicreporting.cftc.gov/api/                     │
│                 (External Data Source)                           │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Component Breakdown

### Frontend (React)

```
src/
├── pages/
│   └── Dashboard.page.tsx
│       ├── Uses: MarketSelector
│       ├── Uses: StackedBarChart
│       ├── Uses: MetricsPanel
│       └── Data: useCotData hook
│
├── components/
│   ├── dashboard/
│   │   ├── MarketSelector.tsx
│   │   │   └── Data: useMarkets hook
│   │   └── MetricsPanel.tsx
│   │       └── Props: CotData
│   │
│   └── charts/
│       └── StackedBarChart.tsx
│           └── Library: Recharts
│
├── hooks/
│   ├── useCotData.ts
│   │   └── Uses: @tanstack/react-query
│   └── useMarkets.ts
│       └── Uses: @tanstack/react-query
│
└── api/
    ├── client.ts (Axios instance)
    ├── cot.api.ts
    └── markets.api.ts
```

### Backend (Node.js)

```
src/
├── server.ts (Entry point)
│   └── Initializes: Fastify app
│
├── app.ts (Fastify setup)
│   ├── Registers: Routes
│   ├── Configures: CORS, Error handling
│   └── Returns: Fastify instance
│
├── api/
│   ├── routes/
│   │   ├── cot.routes.ts
│   │   │   └── Endpoints: GET /cot/:symbol, /cot/:symbol/history
│   │   └── markets.routes.ts
│   │       └── Endpoints: GET /markets, /markets/:symbol
│   │
│   └── controllers/
│       ├── cot.controller.ts
│       │   ├── getLatest()
│       │   ├── getHistory()
│       │   └── getBatch()
│       │
│       └── markets.controller.ts
│           ├── getAll()
│           └── getBySymbol()
│
├── services/
│   ├── data-fetcher.service.ts
│   │   ├── fetchWeeklyReports()
│   │   └── External: CFTC API
│   │
│   └── data-transformer.service.ts
│       ├── transformCFTCResponse()
│       ├── calculateMetrics()
│       └── calculateMovingAverages()
│
└── database/
    ├── schema.sql (Database structure)
    │
    └── repositories/
        ├── markets.repo.ts
        │   ├── findAll()
        │   ├── findBySymbol()
        │   └── initializeMarkets()
        │
        └── cot-reports.repo.ts
            ├── findLatestByMarket()
            ├── findByMarketAndDateRange()
            └── bulkCreate()
```

## 🔄 Request Flow

### Example: User Selects "Gold (GC)" Market

```
1. User clicks "GC" in MarketSelector
   ↓
2. Dashboard.page.tsx updates selectedMarket state
   ↓
3. useCotData('GC') hook triggers
   ↓
4. React Query checks cache
   ↓
5. If stale, calls cotApi.getLatest('GC')
   ↓
6. Axios GET request: /api/v1/cot/GC
   ↓
7. Fastify routes to: cotRoutes → CotController.getLatest()
   ↓
8. Controller calls: MarketsRepo.findBySymbol('GC')
   ↓
9. PostgreSQL query: SELECT * FROM markets WHERE symbol = 'GC'
   ↓
10. Controller calls: CotReportsRepo.findLatestByMarket(marketId)
   ↓
11. PostgreSQL query: SELECT * FROM cot_reports WHERE market_id = X ORDER BY report_date DESC LIMIT 1
   ↓
12. Data returned through layers: Repo → Controller → Route → API
   ↓
13. React Query caches response
   ↓
14. Components re-render:
    - StackedBarChart displays position data
    - MetricsPanel shows statistics
```

## 🗄️ Database Schema

```
markets
├── id (PK)
├── symbol (UNIQUE)        # 'GC', 'CL', 'ES'
├── name                   # 'Gold', 'Crude Oil'
├── category              # 'Metal', 'Energy'
└── exchange              # 'COMEX', 'NYMEX'

cot_reports (TimescaleDB Hypertable)
├── id (PK)
├── market_id (FK → markets)
├── report_date           # Tuesday being reported
├── publish_date          # Friday release (partition key)
├── commercial_long
├── commercial_short
├── non_commercial_long
├── non_commercial_short
├── non_reportable_long
├── open_interest
└── ... (30+ columns)

cot_metrics
├── id (PK)
├── cot_report_id (FK)
├── commercial_net        # Calculated: long - short
├── non_commercial_net
├── commercial_long_pct   # Percentage of OI
├── commercial_sentiment  # -100 to +100
└── percentile_rank       # 52-week extreme detection

cot_trends (TimescaleDB Hypertable)
├── id (PK)
├── market_id (FK)
├── week_ending
├── ma_4week_commercial_net   # Moving averages
├── ma_13week_commercial_net
├── roc_4week                 # Rate of change
└── is_extreme_long/short     # Flags

data_fetches
├── id (PK)
├── fetch_type            # 'WEEKLY', 'BACKFILL'
├── records_fetched
├── success
└── created_at
```

## 🔐 Environment Variables

### Backend (.env)
```
DATABASE_URL → config/database.ts → Pool connection
REDIS_URL → BullMQ jobs (future)
PORT → Server listen port
FRONTEND_URL → CORS origin
CFTC_API_BASE → DataFetcherService
```

### Frontend (.env)
```
VITE_API_URL → api/client.ts → Axios baseURL
```

## 🐳 Docker Containers

```
┌─────────────────────────────────────────────────────────┐
│  Container: postgres                                     │
│  Image: timescale/timescaledb:latest-pg15               │
│  Port: 5432                                             │
│  Volume: postgres_data (persistent)                     │
│  Health Check: pg_isready                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Container: redis                                        │
│  Image: redis:7-alpine                                  │
│  Port: 6379                                             │
│  Health Check: redis-cli ping                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Container: api                                          │
│  Build: cot-backend/Dockerfile                          │
│  Port: 3001                                             │
│  Depends: postgres, redis                               │
│  Command: npm run dev                                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Container: frontend                                     │
│  Build: cot-frontend/Dockerfile                         │
│  Port: 3000                                             │
│  Depends: api                                           │
│  Command: npm run dev                                   │
└─────────────────────────────────────────────────────────┘
```

## 🎨 UI Component Tree

```
App.tsx
│
└── QueryClientProvider
    │
    └── DashboardPage
        │
        ├── Header
        │   └── Title + Description
        │
        ├── MarketSelector
        │   ├── useMarkets hook
        │   └── Category Groups
        │       └── Market Buttons
        │
        ├── Current Market Info
        │   └── Symbol + Name + Category Badge
        │
        └── Grid Layout
            │
            ├── StackedBarChart (2 columns)
            │   ├── useCotHistory hook
            │   ├── Recharts ComposedChart
            │   ├── Bar: Commercial Long (red)
            │   ├── Bar: Commercial Short (red)
            │   ├── Bar: Non-Commercial Long (blue)
            │   ├── Bar: Non-Commercial Short (blue)
            │   ├── Bar: Non-Reportable (yellow)
            │   └── Line: Commercial Net (green)
            │
            └── MetricsPanel (1 column)
                ├── useCotData hook
                ├── Report Date
                ├── Open Interest
                ├── Commercial Net
                ├── Speculative Net
                └── Position Breakdown %
```

## 🚀 Deployment Architecture

### Development (Docker Compose)
- All services on localhost
- Hot reload enabled
- Volume mounts for live coding

### Production (Future)
```
Internet
   ↓
CloudFlare / CDN
   ↓
Nginx Reverse Proxy
   ↓
┌──────────────┬──────────────┐
│   Frontend   │   Backend    │
│   (Vercel)   │  (Railway)   │
└──────────────┴──────┬───────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   PostgreSQL      Redis        CFTC API
   (Managed)    (Managed)     (External)
```

---

This architecture provides:
- ✅ **Scalability** - Each layer can scale independently
- ✅ **Maintainability** - Clear separation of concerns
- ✅ **Performance** - Caching at multiple levels
- ✅ **Reliability** - Health checks and error handling
- ✅ **Developer Experience** - Hot reload, TypeScript, Docker
