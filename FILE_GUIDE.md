# File Guide - What Each File Does

## 📋 Root Directory

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Orchestrates all services (PostgreSQL, Redis, API, Frontend) |
| `setup.sh` | Automated setup script - run this first! |
| `README.md` | Full documentation and user guide |
| `QUICKSTART.md` | 5-minute quick start guide |
| `PROJECT_SUMMARY.md` | Overview of what's been built |
| `FILE_GUIDE.md` | This file - explains all files |
| `.gitignore` | Git ignore rules |

## 🔙 Backend (`cot-backend/`)

### Configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `Dockerfile` - Docker build instructions
- `.env` - Environment variables
- `.dockerignore` - Docker ignore rules

### Source Code (`src/`)

#### Entry Points
- `server.ts` - **Main entry point** - starts the server
- `app.ts` - **Fastify app setup** - configures routes and plugins

#### API Layer (`api/`)
- `routes/cot.routes.ts` - CoT data endpoints
- `routes/markets.routes.ts` - Market information endpoints
- `controllers/cot.controller.ts` - CoT business logic
- `controllers/markets.controller.ts` - Markets business logic
- `middlewares/error-handler.ts` - Global error handling

#### Services (`services/`)
- `data-fetcher.service.ts` - **Fetches data from CFTC API**
- `data-transformer.service.ts` - **Transforms and calculates metrics**

#### Database (`database/`)
- `schema.sql` - **Complete database schema** (run this first!)
- `repositories/markets.repo.ts` - Market data access
- `repositories/cot-reports.repo.ts` - CoT data access

#### Configuration (`config/`)
- `env.ts` - Environment variable parsing
- `database.ts` - PostgreSQL connection pool

#### Types (`types/`)
- `cot.types.ts` - TypeScript interfaces for all data models

#### Utilities (`utils/`)
- `logger.ts` - Pino logger setup
- `constants.ts` - **40+ market definitions**

#### Scripts (`scripts/`)
- `init-db.ts` - Initialize database schema
- `fetch-cot-data.ts` - Manual data fetch script

## 🎨 Frontend (`cot-frontend/`)

### Configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `Dockerfile` - Docker build instructions
- `nginx.conf` - Nginx web server config
- `.env` - Environment variables
- `index.html` - HTML entry point

### Source Code (`src/`)

#### Entry Points
- `main.tsx` - **React app entry point**
- `App.tsx` - **Main app component with React Query**
- `App.css` - Global styles

#### API Layer (`api/`)
- `client.ts` - **Axios instance with interceptors**
- `cot.api.ts` - CoT data API calls
- `markets.api.ts` - Markets API calls
- `types.ts` - TypeScript interfaces

#### Hooks (`hooks/`)
- `useCotData.ts` - **React Query hooks for CoT data**
- `useMarkets.ts` - React Query hooks for markets

#### Components (`components/`)

##### Charts (`charts/`)
- `StackedBarChart.tsx` - **Main visualization component**

##### Dashboard (`dashboard/`)
- `MarketSelector.tsx` - **Market selection UI**
- `MetricsPanel.tsx` - **Statistics display**

#### Pages (`pages/`)
- `Dashboard.page.tsx` - **Main dashboard page**

## 🔑 Key Files to Understand

### Must Read First
1. `README.md` - Start here
2. `QUICKSTART.md` - Get running quickly
3. `PROJECT_SUMMARY.md` - Understand what's built

### Backend Core
1. `cot-backend/src/server.ts` - Server startup
2. `cot-backend/src/database/schema.sql` - Database structure
3. `cot-backend/src/utils/constants.ts` - Markets configuration
4. `cot-backend/src/services/data-fetcher.service.ts` - CFTC API integration
5. `cot-backend/src/api/routes/cot.routes.ts` - API endpoints

### Frontend Core
1. `cot-frontend/src/App.tsx` - React app setup
2. `cot-frontend/src/pages/Dashboard.page.tsx` - Main UI
3. `cot-frontend/src/components/charts/StackedBarChart.tsx` - Chart visualization
4. `cot-frontend/src/hooks/useCotData.ts` - Data fetching logic
5. `cot-frontend/src/api/client.ts` - API communication

### DevOps
1. `docker-compose.yml` - Service orchestration
2. `setup.sh` - Automated setup
3. `cot-backend/Dockerfile` - Backend container
4. `cot-frontend/Dockerfile` - Frontend container

## 🎯 Files by Task

### To Add a New Market
1. Edit `cot-backend/src/utils/constants.ts`
2. Restart backend: `docker-compose restart api`
3. Markets auto-initialize on startup

### To Modify the Chart
1. Edit `cot-frontend/src/components/charts/StackedBarChart.tsx`
2. Change colors, layout, data transformations

### To Add a New API Endpoint
1. Create route in `cot-backend/src/api/routes/`
2. Create controller in `cot-backend/src/api/controllers/`
3. Register route in `cot-backend/src/app.ts`

### To Change the Database Schema
1. Edit `cot-backend/src/database/schema.sql`
2. Create migration file in `cot-backend/src/database/migrations/`
3. Run `npm run init-db`

### To Fetch Data from CFTC
1. Run `cd cot-backend && npm run fetch-data`
2. Or implement BullMQ job in `cot-backend/src/jobs/`

## 📊 Data Flow Through Files

```
CFTC API
   ↓
data-fetcher.service.ts (fetch)
   ↓
data-transformer.service.ts (transform)
   ↓
cot-reports.repo.ts (save)
   ↓
PostgreSQL Database
   ↓
cot.controller.ts (retrieve)
   ↓
cot.routes.ts (serve)
   ↓
Fastify API
   ↓
cot.api.ts (call)
   ↓
useCotData.ts (React Query)
   ↓
Dashboard.page.tsx (render)
   ↓
StackedBarChart.tsx (visualize)
```

## 🚀 Running Commands

### Start Everything
```bash
./setup.sh
```

### Backend Only
```bash
cd cot-backend
npm install
npm run dev
```

### Frontend Only
```bash
cd cot-frontend
npm install
npm run dev
```

### Fetch Data
```bash
cd cot-backend
npm run fetch-data
```

### Initialize Database
```bash
cd cot-backend
npm run init-db
```

## 🔍 Debugging

| Issue | File to Check |
|-------|--------------|
| Server won't start | `cot-backend/src/server.ts`, `.env` |
| Database errors | `cot-backend/src/config/database.ts` |
| API not responding | `cot-backend/src/app.ts` |
| Chart not showing | `cot-frontend/src/components/charts/StackedBarChart.tsx` |
| Data not loading | `cot-frontend/src/api/cot.api.ts` |
| Markets not listed | `cot-backend/src/utils/constants.ts` |

## 📝 Configuration Files

| Setting | File |
|---------|------|
| API Port | `cot-backend/.env` (PORT) |
| Frontend Port | `cot-frontend/vite.config.ts` (server.port) |
| Database URL | `cot-backend/.env` (DATABASE_URL) |
| CORS Origins | `cot-backend/src/app.ts` (fastifyCors) |
| API Base URL | `cot-frontend/.env` (VITE_API_URL) |

---

Need to modify something? This guide shows you exactly which file to edit! 🎯
