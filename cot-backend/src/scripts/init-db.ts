import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

async function initDatabase() {
  try {
    logger.info('Initializing database...');

    // Read schema file
    const schemaPath = join(__dirname, '../database/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Execute schema
    await pool.query(schema);

    logger.info('Database initialized successfully');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Failed to initialize database');
    process.exit(1);
  }
}

initDatabase();
