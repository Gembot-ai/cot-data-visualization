# Commitment of Traders (CoT) Data Aggregator & Visualization Platform
## Technical Specification - Node.js + React Stack

**Status:** Draft  
**Version:** 2.0  
**Stack:** Node.js (TypeScript) + Express/Fastify + PostgreSQL + React 18  
**Last Updated:** December 22, 2025

---

## Executive Summary

Complete technical specification for building a CoT data aggregation and visualization platform using **Node.js** backend and **React 18** frontend. Fetch weekly CFTC CoT reports via official API, compute advanced metrics, and render interactive dashboards with stacked bar charts (Commercial/Non-Commercial/Non-Reportable positions).

**Key Differentiators:**
- Real-time data aggregation from official CFTC sources
- Multi-market comparison with advanced filtering
- Interactive React dashboards with 52-week visualization
- Webhook-ready API for integration with trading platforms
- Mobile-responsive design with dark mode
- Developer-friendly REST + WebSocket API

---

## 1. Backend Architecture (Node.js)

### 1.1 Tech Stack Selection

```
Runtime:            Node.js 20+ (LTS)
Language:           TypeScript 5.3+
Web Framework:      Fastify (Recommended) or Express.js
Database:           PostgreSQL 15+ with TimescaleDB
Cache:              Redis 7+
Job Queue:          BullMQ (Redis-backed, integrated with Next.js/Node.js)
Data Processing:    Native Node.js + Lodash/Ramda
API Docs:           Swagger/OpenAPI via @fastify/swagger
Testing:            Jest + Supertest
Authentication:     JWT (jsonwebtoken)
Validation:         Zod or Joi
Monitoring:         Pino (logging), OpenTelemetry
Deployment:         Docker + AWS ECS/Railway/Render
```

**Why Node.js + Fastify:**
- ✅ **Fast:** Fastify benchmarks 2-3x faster than Express for high-throughput APIs
- ✅ **Same language:** TypeScript shared between backend and frontend
- ✅ **Async-native:** Perfect for I/O operations (API calls, DB queries)
- ✅ **Ecosystem:** Excellent libraries for time-series data (TimescaleDB, Grafana)
- ✅ **Scalability:** Horizontal scaling with PM2 or Kubernetes
- ✅ **Real-time:** WebSocket support via socket.io or ws + fastify-websocket

### 1.2 Project Structure

```
cot-backend/
├── src/
│   ├── api/                          # API routes
│   │   ├── routes/
│   │   │   ├── cot.routes.ts         # GET /cot endpoints
│   │   │   ├── markets.routes.ts     # GET /markets endpoints
│   │   │   ├── analytics.routes.ts   # GET /analytics endpoints
│   │   │   ├── trends.routes.ts      # GET /trends endpoints
│   │   │   ├── export.routes.ts      # GET /export endpoints
│   │   │   └── admin.routes.ts       # POST /admin endpoints (protected)
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts    # JWT verification
│   │   │   ├── rate-limit.ts         # Rate limiting per tier
│   │   │   ├── validation.ts         # Zod schema validation
│   │   │   └── error-handler.ts      # Global error handler
│   │   └── controllers/
│   │       ├── cot.controller.ts
│   │       ├── markets.controller.ts
│   │       ├── analytics.controller.ts
│   │       ├── trends.controller.ts
│   │       └── export.controller.ts
│   │
│   ├── services/                     # Business logic
│   │   ├── data-fetcher.service.ts   # CFTC API integration
│   │   ├── data-transformer.service.ts # Data normalization & metrics
│   │   ├── analytics.service.ts      # Advanced calculations
│   │   ├── trends.service.ts         # MA, ROC, extremes
│   │   ├── export.service.ts         # CSV, PDF generation
│   │   ├── cache.service.ts          # Redis operations
│   │   └── websocket.service.ts      # Real-time updates
│   │
│   ├── jobs/                         # Scheduled tasks (BullMQ)
│   │   ├── fetch-weekly-cot.job.ts   # Runs Friday 4 PM EST
│   │   ├── calculate-metrics.job.ts  # Compute derived fields
│   │   ├── backfill-history.job.ts   # Historical data one-time
│   │   └── cleanup.job.ts            # Archive old data
│   │
│   ├── database/
│   │   ├── schema.sql                # All table definitions
│   │   ├── migrations/
│   │   │   ├── 001-initial-schema.sql
│   │   │   ├── 002-add-metrics-table.sql
│   │   │   └── 003-add-indexes.sql
│   │   ├── repositories/             # Data access layer
│   │   │   ├── markets.repo.ts
│   │   │   ├── cot-reports.repo.ts
│   │   │   ├── cot-metrics.repo.ts
│   │   │   └── data-fetches.repo.ts
│   │   └── db.ts                     # Connection pool
│   │
│   ├── types/                        # TypeScript interfaces
│   │   ├── cot.types.ts
│   │   ├── api.types.ts
│   │   └── config.types.ts
│   │
│   ├── utils/                        # Helpers
│   │   ├── logger.ts                 # Pino setup
│   │   ├── calculations.ts           # MA, ROC, percentile logic
│   │   ├── validators.ts             # Data validation
│   │   ├── errors.ts                 # Custom error classes
│   │   └── constants.ts              # Market symbols, enums
│   │
│   ├── config/
│   │   ├── env.ts                    # Environment variables (dotenv)
│   │   ├── database.ts               # PostgreSQL connection config
│   │   ├── redis.ts                  # Redis client config
│   │   ├── bullmq.ts                 # Job queue config
│   │   └── cors.ts                   # CORS settings
│   │
│   └── app.ts                        # Fastify app initialization
│   └── server.ts                     # Entry point
│
├── tests/
│   ├── unit/                         # Jest test suites
│   │   ├── services/
│   │   │   ├── data-transformer.test.ts
│   │   │   └── analytics.test.ts
│   │   └── utils/
│   │       └── calculations.test.ts
│   ├── integration/
│   │   ├── cot.routes.test.ts
│   │   └── data-fetcher.test.ts
│   └── fixtures/
│       └── cot-sample-data.json
│
├── .env.example
├── .dockerignore
├── docker-compose.yml                # Local dev: PostgreSQL + Redis + API
├── Dockerfile
├── tsconfig.json
├── jest.config.js
├── package.json
└── README.md
```

### 1.3 Database Schema (PostgreSQL with TimescaleDB)

```sql
-- Enable TimescaleDB extension for time-series optimization
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Markets dimension table
CREATE TABLE markets (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,      -- 'Energy', 'Metal', 'Financial', etc.
  exchange VARCHAR(50),                -- 'CBOT', 'NYMEX', 'COMEX', etc.
  description TEXT,
  contract_unit VARCHAR(100),          -- e.g., "100 oz", "1,000 bbl"
  tick_size DECIMAL(10, 6),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_markets_symbol ON markets(symbol);
CREATE INDEX idx_markets_category ON markets(category);

-- Main CoT reports table (time-series, hypertable)
CREATE TABLE cot_reports (
  id BIGSERIAL NOT NULL,
  market_id INTEGER NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,           -- The Tuesday being reported
  publish_date DATE NOT NULL,          -- Friday release date
  
  -- Commercial traders (hedgers)
  commercial_long BIGINT NOT NULL,
  commercial_short BIGINT NOT NULL,
  commercial_spreading BIGINT,
  num_commercial_long INT,
  num_commercial_short INT,
  
  -- Non-Commercial traders (speculators)
  non_commercial_long BIGINT NOT NULL,
  non_commercial_short BIGINT NOT NULL,
  non_commercial_spreading BIGINT,
  num_non_commercial_long INT,
  num_non_commercial_short INT,
  
  -- Non-Reportable (retail)
  non_reportable_long BIGINT,
  non_reportable_short BIGINT,
  num_non_reportable_long INT,
  num_non_reportable_short INT,
  
  -- Week-over-week changes
  commercial_long_change BIGINT,
  commercial_short_change BIGINT,
  non_commercial_long_change BIGINT,
  non_commercial_short_change BIGINT,
  
  -- Open interest
  open_interest BIGINT NOT NULL,
  
  -- Disaggregated data (optional, for advanced CoT reports)
  swap_dealers_long BIGINT,
  swap_dealers_short BIGINT,
  managed_money_long BIGINT,
  managed_money_short BIGINT,
  other_reportable_long BIGINT,
  other_reportable_short BIGINT,
  
  -- Metadata
  source VARCHAR(50) DEFAULT 'CFTC_API',  -- 'CFTC_API', 'SCRAPING', 'MANUAL'
  data_quality_score DECIMAL(3,2),        -- 0-1 confidence
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id, publish_date)
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('cot_reports', 'publish_date', if_not_exists => TRUE);

-- Unique constraint per market per week
ALTER TABLE cot_reports ADD CONSTRAINT unique_market_week 
  UNIQUE (market_id, report_date);

-- Indexes for common queries
CREATE INDEX idx_cot_market_date ON cot_reports (market_id, report_date DESC);
CREATE INDEX idx_cot_publish_date ON cot_reports (publish_date DESC);

-- Computed metrics table
CREATE TABLE cot_metrics (
  id BIGSERIAL PRIMARY KEY,
  cot_report_id BIGINT NOT NULL UNIQUE REFERENCES cot_reports(id) ON DELETE CASCADE,
  
  -- Net positions
  commercial_net BIGINT,
  non_commercial_net BIGINT,
  
  -- Percentages of OI
  commercial_long_pct DECIMAL(5,2),
  commercial_short_pct DECIMAL(5,2),
  non_commercial_long_pct DECIMAL(5,2),
  non_commercial_short_pct DECIMAL(5,2),
  non_reportable_pct DECIMAL(5,2),
  
  -- Commercial sentiment (-100 to +100)
  commercial_sentiment INT,
  
  -- 52-week extremes
  commercial_net_52w_high BIGINT,
  commercial_net_52w_low BIGINT,
  percentile_rank INT,                 -- 0-100
  
  -- Concentration ratios
  top_4_long_pct DECIMAL(5,2),
  top_4_short_pct DECIMAL(5,2),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metrics_report ON cot_metrics(cot_report_id);

-- Trends and moving averages
CREATE TABLE cot_trends (
  id BIGSERIAL NOT NULL,
  market_id INTEGER NOT NULL REFERENCES markets(id),
  week_ending DATE NOT NULL,
  
  -- Moving averages
  ma_4week_commercial_net BIGINT,
  ma_13week_commercial_net BIGINT,
  ma_26week_commercial_net BIGINT,
  
  -- Rate of change
  roc_4week DECIMAL(6,2),              -- %
  roc_13week DECIMAL(6,2),
  
  -- Extreme flags
  is_extreme_long BOOLEAN DEFAULT false,
  is_extreme_short BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id, week_ending)
);

SELECT create_hypertable('cot_trends', 'week_ending', if_not_exists => TRUE);
CREATE INDEX idx_trends_market_date ON cot_trends (market_id, week_ending DESC);

-- API audit log
CREATE TABLE data_fetches (
  id BIGSERIAL PRIMARY KEY,
  fetch_type VARCHAR(50),              -- 'WEEKLY', 'BACKFILL', 'MANUAL'
  source VARCHAR(50) DEFAULT 'CFTC_API',
  market_symbols VARCHAR(255),         -- Comma-separated list fetched
  records_fetched INT,
  records_inserted INT,
  records_updated INT,
  fetch_duration_ms INT,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_data_fetches_date ON data_fetches(created_at DESC);
```

### 1.4 Core Services (TypeScript)

#### A. Data Fetcher Service

```typescript
// src/services/data-fetcher.service.ts

import axios from 'axios';
import { z } from 'zod';
import pRetry from 'p-retry';
import { logger } from '../utils/logger';

interface CFTCApiResponse {
  data: Array<{
    market_and_exchange_names: string;
    contract_code: string;
    report_date_as_yyyy_mm_dd: string;
    comm_long: number;
    comm_short: number;
    comm_spreading: number;
    noncomm_long: number;
    noncomm_short: number;
    noncomm_spreading: number;
    open_interest_all: number;
    // ... other fields
  }>;
}

export class DataFetcherService {
  private readonly CFTC_API_BASE = 'https://publicreporting.cftc.gov/api/';
  private readonly marketMap: Map<string, number> = new Map(); // Cache market IDs

  /**
   * Fetch latest CoT reports for specific markets
   * Runs via BullMQ job every Friday 4 PM EST
   */
  async fetchWeeklyReports(marketIds: number[]): Promise<CFTCApiResponse> {
    try {
      const params = {
        report_type: 'legacy',  // Use legacy for broad market coverage
        market_and_exchange_names: this.getMarketQuery(marketIds),
        breakdown: 'All'
      };

      return await pRetry(
        () => axios.get(`${this.CFTC_API_BASE}commitmentoftraders`, { params }),
        {
          retries: 3,
          minTimeout: 1000,
          maxTimeout: 30000,
          onFailedAttempt: (error) => {
            logger.warn({
              attempt: error.attemptNumber,
              retriesLeft: error.retriesLeft,
              error: error.message
            }, 'CFTC API retry');
          }
        }
      );
    } catch (error) {
      logger.error({ error }, 'Failed to fetch CFTC data after retries');
      throw new Error(`CFTC API fetch failed: ${error.message}`);
    }
  }

  /**
   * One-time backfill for historical data (12 months prior)
   */
  async backfillHistoricalData(
    marketId: number,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    const weeks = this.generateWeeks(startDate, endDate);
    logger.info({ 
      market: marketId, 
      weeks: weeks.length 
    }, 'Starting historical backfill');

    // Fetch with concurrent requests (5 at a time to respect rate limits)
    for (let i = 0; i < weeks.length; i += 5) {
      const batch = weeks.slice(i, i + 5);
      await Promise.all(batch.map(week => this.fetchWeeklyReports([marketId])));
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1s between batches
    }
  }

  /**
   * Validate that all expected markets are in the response
   */
  validateReportCompleteness(response: CFTCApiResponse, expectedMarkets: number): boolean {
    const uniqueMarkets = new Set(response.data.map(r => r.market_and_exchange_names));
    return uniqueMarkets.size >= expectedMarkets * 0.9; // Allow 10% missing
  }

  private getMarketQuery(marketIds: number[]): string {
    // Build CFTC API query based on market IDs
    const marketSymbols = ['GC', 'CL', 'ES', 'ZB', 'ZC']; // Map IDs to symbols
    return marketSymbols.join(',');
  }

  private generateWeeks(start: Date, end: Date): Date[] {
    const weeks: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      weeks.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
    return weeks;
  }
}
```

#### B. Data Transformer Service

```typescript
// src/services/data-transformer.service.ts

import { CotReport, CotMetrics } from '../types/cot.types';

export class DataTransformerService {
  /**
   * Transform raw CFTC API response to internal schema
   */
  transformCFTCResponse(raw: any, marketId: number): CotReport {
    return {
      market_id: marketId,
      report_date: new Date(raw.report_date_as_yyyy_mm_dd),
      publish_date: new Date(), // CFTC publishes Fridays
      
      commercial_long: raw.comm_long,
      commercial_short: raw.comm_short,
      commercial_spreading: raw.comm_spreading,
      
      non_commercial_long: raw.noncomm_long,
      non_commercial_short: raw.noncomm_short,
      non_commercial_spreading: raw.noncomm_spreading,
      
      non_reportable_long: this.calculateNonReportable(
        raw.open_interest_all,
        raw.comm_long + raw.noncomm_long
      ),
      
      open_interest: raw.open_interest_all,
      source: 'CFTC_API'
    };
  }

  /**
   * Calculate derived metrics (net positions, percentages, etc.)
   */
  calculateMetrics(report: CotReport): CotMetrics {
    const oi = report.open_interest;
    
    const commercialNet = report.commercial_long - report.commercial_short;
    const nonCommercialNet = report.non_commercial_long - report.non_commercial_short;
    
    return {
      cot_report_id: report.id!,
      
      commercial_net: commercialNet,
      non_commercial_net: nonCommercialNet,
      
      commercial_long_pct: (report.commercial_long / oi) * 100,
      commercial_short_pct: (report.commercial_short / oi) * 100,
      
      non_commercial_long_pct: (report.non_commercial_long / oi) * 100,
      non_commercial_short_pct: (report.non_commercial_short / oi) * 100,
      
      // Sentiment from -100 (all short) to +100 (all long)
      commercial_sentiment: this.calculateSentiment(commercialNet, oi),
      
      // Concentration ratios (from historical data)
      top_4_long_pct: 0, // Would fetch from disaggregated report
      top_4_short_pct: 0,
    };
  }

  /**
   * Calculate 4-week and 13-week moving averages
   */
  calculateMovingAverages(
    reports: CotReport[],
    period: 4 | 13 | 26 = 4
  ): (CotReport['commercial_net'] | null)[] {
    return reports.map((report, index) => {
      if (index < period - 1) return null; // Not enough data
      
      const slice = reports.slice(index - period + 1, index + 1);
      const sum = slice.reduce((acc, r) => {
        const net = r.commercial_long - r.commercial_short;
        return acc + net;
      }, 0);
      
      return Math.round(sum / period);
    });
  }

  /**
   * Detect extreme positions vs 52-week range
   */
  detectExtremes(
    currentReport: CotReport,
    historicalReports: CotReport[],
    percentileThreshold: number = 90
  ): { isExtreme: boolean; percentile: number } {
    const nets = historicalReports.map(r => r.commercial_long - r.commercial_short);
    const currentNet = currentReport.commercial_long - currentReport.commercial_short;
    
    const min = Math.min(...nets);
    const max = Math.max(...nets);
    
    const percentile = ((currentNet - min) / (max - min)) * 100;
    const isExtreme = percentile >= percentileThreshold || percentile <= (100 - percentileThreshold);
    
    return { isExtreme, percentile: Math.round(percentile) };
  }

  private calculateNonReportable(
    totalOI: number,
    reportedLong: number
  ): number {
    // Simplified calculation
    return Math.max(0, totalOI - reportedLong);
  }

  private calculateSentiment(
    commercialNet: number,
    openInterest: number
  ): number {
    // Normalize to -100 to +100 scale
    const normalized = (commercialNet / openInterest) * 200;
    return Math.max(-100, Math.min(100, Math.round(normalized)));
  }
}
```

#### C. Analytics Service

```typescript
// src/services/analytics.service.ts

import { CotReport, CotMetrics } from '../types/cot.types';

export class AnalyticsService {
  /**
   * Get comparison data for multiple markets
   */
  async getMarketComparison(
    marketIds: number[],
    reportRepo,
    metricsRepo
  ): Promise<Record<number, any>> {
    const result: Record<number, any> = {};
    
    for (const marketId of marketIds) {
      const latestReport = await reportRepo.getLatestByMarket(marketId);
      const metrics = await metricsRepo.getByReportId(latestReport.id);
      
      result[marketId] = {
        reportDate: latestReport.report_date,
        commercialNet: metrics.commercial_net,
        commercialSentiment: metrics.commercial_sentiment,
        openInterest: latestReport.open_interest,
        nonCommercialNet: metrics.non_commercial_net
      };
    }
    
    return result;
  }

  /**
   * Calculate correlation matrix between markets
   */
  async calculateCorrelations(
    marketIds: number[],
    reportRepo,
    weeks: number = 52
  ): Promise<number[][]> {
    // Fetch 52 weeks of net position data for each market
    const marketData: Record<number, number[]> = {};
    
    for (const marketId of marketIds) {
      const reports = await reportRepo.getHistorical(marketId, weeks);
      marketData[marketId] = reports.map(r => r.commercial_long - r.commercial_short);
    }
    
    // Compute Pearson correlation for each pair
    const matrix: number[][] = Array(marketIds.length)
      .fill(null)
      .map(() => Array(marketIds.length).fill(0));
    
    for (let i = 0; i < marketIds.length; i++) {
      for (let j = i; j < marketIds.length; j++) {
        const corr = this.pearsonCorrelation(
          marketData[marketIds[i]],
          marketData[marketIds[j]]
        );
        matrix[i][j] = corr;
        matrix[j][i] = corr;
      }
    }
    
    return matrix;
  }

  /**
   * Identify price-CoT divergences (advanced)
   */
  async identifyDivergences(
    marketId: number,
    priceData: number[], // Price time series
    cotData: number[] // Commercial net positions
  ): Promise<Array<{ week: number; strength: 'bullish' | 'bearish' }>> {
    const divergences: any[] = [];
    
    for (let i = 1; i < priceData.length; i++) {
      const priceChange = priceData[i] - priceData[i - 1];
      const cotChange = cotData[i] - cotData[i - 1];
      
      // Divergence: price and CoT moving opposite directions
      if ((priceChange > 0 && cotChange < 0) || (priceChange < 0 && cotChange > 0)) {
        divergences.push({
          week: i,
          strength: priceChange > 0 ? 'bullish' : 'bearish'
        });
      }
    }
    
    return divergences;
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }
    
    return numerator / Math.sqrt(denomX * denomY);
  }
}
```

### 1.5 BullMQ Job Scheduler

```typescript
// src/jobs/fetch-weekly-cot.job.ts

import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { logger } from '../utils/logger';
import { DataFetcherService } from '../services/data-fetcher.service';
import { DataTransformerService } from '../services/data-transformer.service';

const redis = new Redis(process.env.REDIS_URL);

// Create queue
export const cotFetchQueue = new Queue('cot-fetch', { connection: redis });

// Schedule Friday 4 PM EST (20:00 UTC, adjusting for EST)
export async function scheduleWeeklyCotFetch() {
  // Using node-cron alternative with BullMQ repeatable jobs
  await cotFetchQueue.add(
    'weekly-fetch',
    { markets: ['GC', 'CL', 'ES', 'ZB', 'ZC'] },
    {
      repeat: {
        pattern: '0 20 * * FRI', // 8 PM UTC = 3 PM EST
        // For testing: '*/10 * * * * *' (every 10 seconds)
      },
      removeOnComplete: true,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    }
  );

  logger.info('CoT weekly fetch job scheduled for Friday 20:00 UTC');
}

// Worker processes jobs from queue
export const cotFetchWorker = new Worker(
  'cot-fetch',
  async (job) => {
    const fetcher = new DataFetcherService();
    const transformer = new DataTransformerService();
    
    try {
      logger.info({ jobId: job.id }, 'Starting CoT fetch job');
      
      const rawData = await fetcher.fetchWeeklyReports([1, 2, 3, 4, 5]); // Market IDs
      
      if (!fetcher.validateReportCompleteness(rawData, 5)) {
        throw new Error('Incomplete CoT data received');
      }
      
      // Transform and save to DB
      const transformed = rawData.data.map(r => transformer.transformCFTCResponse(r, 1));
      
      // Save via repository (see DB section)
      // await cotReportRepo.insert(transformed);
      
      logger.info({ records: transformed.length }, 'CoT fetch completed successfully');
      
      return { success: true, recordsProcessed: transformed.length };
    } catch (error) {
      logger.error({ error, jobId: job.id }, 'CoT fetch job failed');
      throw error; // Triggers retry
    }
  },
  { connection: redis }
);

cotFetchWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Job completed');
});

cotFetchWorker.on('failed', (job, error) => {
  logger.error({ jobId: job?.id, error }, 'Job failed');
});
```

### 1.6 API Routes (Fastify)

```typescript
// src/api/routes/cot.routes.ts

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { CotController } from '../controllers/cot.controller';

const querySchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  markets: z.string().optional()
});

export async function cotRoutes(fastify: FastifyInstance) {
  const controller = new CotController();

  // GET /api/v1/cot/:marketId - Latest CoT for single market
  fastify.get<{ Params: { marketId: string } }>(
    '/cot/:marketId',
    async (request, reply) => {
      const { marketId } = request.params;
      return controller.getLatest(marketId);
    }
  );

  // GET /api/v1/cot/:marketId/history - Historical data
  fastify.get<{ Params: { marketId: string }; Querystring: z.infer<typeof querySchema> }>(
    '/cot/:marketId/history',
    {
      schema: {
        querystring: {
          start: { type: 'string', format: 'date-time' },
          end: { type: 'string', format: 'date-time' }
        }
      }
    },
    async (request, reply) => {
      const { marketId } = request.params;
      const { start, end } = request.query;
      return controller.getHistory(marketId, start, end);
    }
  );

  // GET /api/v1/cot/batch - Multi-market fetch
  fastify.get<{ Querystring: { markets: string } }>(
    '/cot/batch',
    async (request, reply) => {
      const { markets } = request.query;
      return controller.getBatch(markets.split(','));
    }
  );
}

// src/app.ts - Main Fastify setup

import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import { cotRoutes } from './api/routes/cot.routes';
import { marketsRoutes } from './api/routes/markets.routes';
import { analyticsRoutes } from './api/routes/analytics.routes';
import { errorHandler } from './api/middlewares/error-handler';

export async function buildApp() {
  const fastify = Fastify({
    logger: true,
    requestIdLogLabel: 'reqId',
    disableRequestLogging: false
  });

  // Plugins
  fastify.register(fastifyCors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  });

  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'dev-secret'
  });

  fastify.register(fastifyWebsocket);

  // Routes
  fastify.register(cotRoutes, { prefix: '/api/v1' });
  fastify.register(marketsRoutes, { prefix: '/api/v1' });
  fastify.register(analyticsRoutes, { prefix: '/api/v1' });

  // Error handling
  fastify.setErrorHandler(errorHandler);

  // Health check
  fastify.get('/health', async () => ({ status: 'ok' }));

  return fastify;
}
```

---

## 2. Frontend Architecture (React 18)

### 2.1 Tech Stack

```
Framework:          React 18.2+
Build Tool:         Vite 5+
UI Library:         Tailwind CSS 3.3+ + Shadcn/ui
State Management:   TanStack Query (React Query) + Zustand
Charts:             Recharts 2.10+
HTTP Client:        Axios with interceptors
Real-time:          Socket.io-client
Testing:            Vitest + React Testing Library
Deployment:         Vercel or AWS S3 + CloudFront
```

### 2.2 Project Structure

```
cot-frontend/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx          # Main dashboard layout
│   │   │   ├── MarketSelector.tsx     # Multi-select markets
│   │   │   ├── ChartPanel.tsx         # Chart container
│   │   │   ├── MetricsPanel.tsx       # KPI display
│   │   │   └── ComparisonView.tsx     # Multi-market comparison
│   │   │
│   │   ├── charts/
│   │   │   ├── StackedBarChart.tsx    # Main CoT visualization
│   │   │   ├── TimeSeriesChart.tsx    # Line chart
│   │   │   ├── CorrelationHeatmap.tsx # Market correlations
│   │   │   └── SentimentGauge.tsx     # -100 to +100 gauge
│   │   │
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── DarkModeToggle.tsx
│   │   │
│   │   └── export/
│   │       ├── ExportModal.tsx
│   │       └── ExportOptions.tsx
│   │
│   ├── hooks/
│   │   ├── useCotData.ts              # Fetch CoT data (React Query)
│   │   ├── useMarkets.ts              # Market list management
│   │   ├── useRealtime.ts             # WebSocket subscription
│   │   ├── useDarkMode.ts             # Dark mode toggle
│   │   ├── useChartState.ts           # Chart visualization state
│   │   └── useExport.ts               # Export functionality
│   │
│   ├── store/
│   │   └── uiStore.ts                 # Zustand state (sidebar, filters, etc.)
│   │
│   ├── api/
│   │   ├── client.ts                  # Axios instance with interceptors
│   │   ├── cot.api.ts                 # CoT endpoints
│   │   ├── markets.api.ts             # Markets endpoints
│   │   ├── analytics.api.ts           # Analytics endpoints
│   │   └── types.ts                   # TypeScript interfaces
│   │
│   ├── utils/
│   │   ├── formatters.ts              # Number, date formatting
│   │   ├── colors.ts                  # Chart color schemes
│   │   ├── constants.ts               # Market symbols, categories
│   │   └── validators.ts              # Form validation
│   │
│   ├── pages/
│   │   ├── Dashboard.page.tsx         # / route
│   │   ├── Comparison.page.tsx        # /comparison route
│   │   ├── Analytics.page.tsx         # /analytics route
│   │   └── Settings.page.tsx          # /settings route
│   │
│   ├── App.tsx                        # Main app component
│   ├── App.css                        # Global styles
│   └── main.tsx                       # Entry point
│
├── tests/
│   ├── components/
│   │   ├── Dashboard.test.tsx
│   │   ├── StackedBarChart.test.tsx
│   │   └── MetricsPanel.test.tsx
│   ├── hooks/
│   │   └── useCotData.test.ts
│   └── utils/
│       └── formatters.test.ts
│
├── public/
│   ├── icons/
│   └── favicon.ico
│
├── .env.example
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── vitest.config.ts
├── package.json
└── README.md
```

### 2.3 Core Hooks & API

#### useCotData Hook

```typescript
// src/hooks/useCotData.ts

import { useQuery } from '@tanstack/react-query';
import { cotApi } from '../api/cot.api';

export function useCotData(marketId: string, options = {}) {
  return useQuery({
    queryKey: ['cot', marketId],
    queryFn: () => cotApi.getLatest(marketId),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 2,
    ...options
  });
}

export function useCotHistory(
  marketId: string,
  startDate: Date,
  endDate: Date
) {
  return useQuery({
    queryKey: ['cot-history', marketId, startDate, endDate],
    queryFn: () => cotApi.getHistory(marketId, startDate, endDate),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    retry: 2
  });
}

export function useMarketComparison(marketIds: string[]) {
  return useQuery({
    queryKey: ['comparison', marketIds],
    queryFn: () => cotApi.getBatch(marketIds),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60
  });
}
```

#### Stacked Bar Chart Component

```typescript
// src/components/charts/StackedBarChart.tsx

import React from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { CotData } from '../../api/types';

interface StackedBarChartProps {
  data: CotData[];
  darkMode: boolean;
}

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
  data,
  darkMode
}) => {
  const colors = {
    commercial: '#ef4444',      // Red for commercial (often short)
    nonCommercial: '#3b82f6',   // Blue for specs (long bias)
    nonReportable: '#fbbf24',   // Yellow for retail
    net: '#10b981'              // Green for net line
  };

  const chartData = data.map(d => ({
    weekEnding: d.report_date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }),
    commercial: d.commercial_short * -1, // Invert shorts to negative
    nonCommercial: d.non_commercial_long,
    nonReportable: d.non_reportable_long,
    commercialNet: d.commercial_long - d.commercial_short,
    open_interest: d.open_interest
  }));

  const tooltipFormatter = (value: number) => {
    return [value.toLocaleString(), ''];
  };

  return (
    <div className={`w-full h-96 ${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={darkMode ? '#374151' : '#e5e7eb'}
          />
          <XAxis 
            dataKey="weekEnding"
            tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#666' }}
          />
          <YAxis 
            label={{ value: 'Contracts', angle: -90, position: 'insideLeft' }}
            tick={{ fill: darkMode ? '#9ca3af' : '#666' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: darkMode ? '#1f2937' : '#fff',
              border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: '0.5rem'
            }}
            formatter={tooltipFormatter}
            labelStyle={{ color: darkMode ? '#fff' : '#000' }}
          />
          <Legend />

          {/* Stacked bars */}
          <Bar dataKey="nonCommercial" stackId="a" fill={colors.nonCommercial} />
          <Bar dataKey="nonReportable" stackId="a" fill={colors.nonReportable} />
          <Bar dataKey="commercial" stackId="a" fill={colors.commercial} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
```

#### Dashboard Page

```typescript
// src/pages/Dashboard.page.tsx

import React, { useState, useEffect } from 'react';
import { useCotData, useCotHistory } from '../hooks/useCotData';
import { StackedBarChart } from '../components/charts/StackedBarChart';
import { MetricsPanel } from '../components/dashboard/MetricsPanel';
import { MarketSelector } from '../components/dashboard/MarketSelector';
import { useDarkMode } from '../hooks/useDarkMode';

export const DashboardPage: React.FC = () => {
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(['GC']);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 52 * 7 * 24 * 60 * 60 * 1000), // 52 weeks ago
    end: new Date()
  });
  
  const { darkMode } = useDarkMode();

  // Fetch latest data
  const latestQuery = useCotData(selectedMarkets[0]);
  
  // Fetch historical for chart
  const historyQuery = useCotHistory(
    selectedMarkets[0],
    dateRange.start,
    dateRange.end
  );

  if (latestQuery.isLoading || historyQuery.isLoading) {
    return <div className="text-center py-20">Loading...</div>;
  }

  if (latestQuery.isError || historyQuery.isError) {
    return <div className="text-center py-20 text-red-500">Error loading data</div>;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Commitment of Traders Dashboard
          </h1>
          <MarketSelector
            selectedMarkets={selectedMarkets}
            onChange={setSelectedMarkets}
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts (2 columns) */}
          <div className="lg:col-span-2">
            <StackedBarChart
              data={historyQuery.data || []}
              darkMode={darkMode}
            />
          </div>

          {/* Metrics panel (1 column) */}
          <div className="lg:col-span-1">
            {latestQuery.data && (
              <MetricsPanel
                data={latestQuery.data}
                darkMode={darkMode}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 3. Deployment & DevOps

### 3.1 Docker Compose (Local Development)

```yaml
# docker-compose.yml

version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: cot_user
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: cot_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./src/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cot_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./cot-backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://cot_user:dev_password@postgres:5432/cot_db
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev-secret
      FRONTEND_URL: http://localhost:3000
    ports:
      - "3001:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./cot-backend/src:/app/src
    command: npm run dev

  frontend:
    build:
      context: ./cot-frontend
      dockerfile: Dockerfile
    environment:
      VITE_API_URL: http://localhost:3001
    ports:
      - "3000:3000"
    depends_on:
      - api
    volumes:
      - ./cot-frontend/src:/app/src

volumes:
  postgres_data:
```

### 3.2 Production Dockerfile (Node.js API)

```dockerfile
# Dockerfile

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Copy built app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

# Use dumb-init to properly handle signals
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

### 3.3 GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml

name: Deploy CoT Platform

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: cot_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: 'cot-backend/package-lock.json'

      - name: Install dependencies
        run: npm ci
        working-directory: cot-backend

      - name: Run linter
        run: npm run lint
        working-directory: cot-backend

      - name: Run tests
        run: npm test -- --coverage
        working-directory: cot-backend
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/cot_test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: 'cot-frontend/package-lock.json'

      - name: Install dependencies
        run: npm ci
        working-directory: cot-frontend

      - name: Run linter
        run: npm run lint
        working-directory: cot-frontend

      - name: Run tests
        run: npm test
        working-directory: cot-frontend

  deploy:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel (Frontend)
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          npx vercel deploy --token=$VERCEL_TOKEN --prod

      - name: Deploy to Railway/Render (Backend)
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          # Deploy backend (adjust for your platform)
          npx railway up --token=$RAILWAY_TOKEN
```

---

## 4. Implementation Timeline (Node.js + React)

### Week 1: Project Setup & Database
- ✅ Initialize Node.js/Express/Fastify API
- ✅ Create React 18 + Vite frontend
- ✅ PostgreSQL schema + migrations
- ✅ Docker Compose for local dev
- ✅ TypeScript config for both projects

### Week 2: Data Pipeline
- ✅ DataFetcherService (CFTC API integration)
- ✅ DataTransformerService (schema mapping, metrics)
- ✅ BullMQ job scheduler (Friday 4 PM weekly fetch)
- ✅ Basic REST API endpoints (/cot/:id, /markets)
- ✅ Unit tests for services

### Week 3: React Dashboard
- ✅ Dashboard layout (header, sidebar, main area)
- ✅ MarketSelector component with multi-select
- ✅ StackedBarChart (Recharts) - core visualization
- ✅ MetricsPanel (current week data, % of OI, etc.)
- ✅ useCotData hook with React Query
- ✅ Dark mode toggle with localStorage

### Week 4: Polish & Testing
- ✅ Multi-market comparison page
- ✅ Export to CSV functionality
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Error boundaries and loading states
- ✅ E2E tests with Cypress/Playwright
- ✅ GitHub Actions CI/CD pipeline

**Result:** Production-ready MVP with 5 major markets, weekly data updates, beautiful React UI, and scalable Node.js backend.

---

## 5. Key Differences: Node.js vs Python Backend

| Aspect | Node.js (Recommended) | Python (Alternative) |
|--------|---------------------|---------------------|
| **Setup Speed** | Fast (npm, Vite) | Slower (pip, poetry) |
| **Shared Language** | TypeScript with React | Different languages |
| **JSON/API** | Native, optimized | Works well |
| **Real-time (WebSocket)** | socket.io built-in | Requires extra lib |
| **Database Drivers** | Excellent (pg, prisma) | Good (psycopg2, sqlalchemy) |
| **Job Queue** | BullMQ (Redis-native) | Celery (more complex) |
| **Performance** | Excellent for I/O | Better for CPU-heavy analysis |
| **Team Skills** | JS/TS devs prefer | Python devs prefer |

---

## 6. Next Steps

1. **Clone & Setup:**
   ```bash
   git clone <repo>
   cd cot-backend && npm install
   cd ../cot-frontend && npm install
   docker-compose up
   ```

2. **First Data Fetch:**
   ```bash
   # Trigger manual fetch via API
   curl -X POST http://localhost:3001/admin/sync/trigger
   ```

3. **View Dashboard:**
   ```
   http://localhost:3000
   ```

---

**This spec is optimized for Node.js + React. You have the full tech stack, database design, API contracts, React component structure, and deployment setup to build this end-to-end.**

Ready to start coding? Need code templates for any specific section (e.g., API endpoints, React components)?
