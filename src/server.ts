import { buildApp } from './app';
import { env } from './config/env';
import { testConnection } from './config/database';
import { logger } from './utils/logger';
import { MarketsRepository } from './database/repositories/markets.repo';
import { MARKETS } from './utils/constants';

async function start() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    // Initialize markets if needed
    const marketsRepo = new MarketsRepository();
    const existingMarkets = await marketsRepo.findAll();

    if (existingMarkets.length === 0) {
      logger.info('Initializing markets...');
      const marketsData = Object.entries(MARKETS).map(([symbol, data]) => ({
        symbol,
        name: data.name,
        category: data.category,
        exchange: data.exchange,
        description: `${data.name} futures contract`,
        active: true
      }));

      await marketsRepo.initializeMarkets(marketsData);
      logger.info({ count: marketsData.length }, 'Markets initialized');
    }

    // Build and start Fastify app
    const app = await buildApp();

    await app.listen({
      port: env.PORT,
      host: '0.0.0.0'
    });

    logger.info(
      { port: env.PORT, env: env.NODE_ENV },
      'Server started successfully'
    );
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

start();
