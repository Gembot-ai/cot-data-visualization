import cron from 'node-cron';
import { fetchAllCotData } from '../scripts/fetch-all-cot-data';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * In-app scheduler for automatic CoT data updates.
 *
 * The web service runs 24/7 on Railway, so this fires on a cron schedule
 * (UTC) without any external cron job or manual `npm run weekly-update`.
 *
 * CFTC publishes new reports every Friday ~20:30 UTC. We run DAILY by
 * default so the data is always picked up the next time the schedule fires,
 * even if the service happened to be redeploying at release time. The fetch
 * is idempotent (duplicates are skipped), so running on days with no new
 * report is a cheap no-op.
 *
 * Configure via DATA_FETCH_CRON (cron expression, UTC). Disable with
 * ENABLE_SCHEDULER=false.
 */

// Guard against overlapping runs (a fetch can take several minutes).
let isRunning = false;

async function runFetch(trigger: string): Promise<void> {
  if (isRunning) {
    logger.warn({ trigger }, 'Scheduled CoT fetch skipped — previous run still in progress');
    return;
  }

  isRunning = true;
  const startedAt = Date.now();

  try {
    logger.info({ trigger }, '🕐 Scheduled CoT data fetch starting...');
    await fetchAllCotData();
    logger.info(
      { trigger, durationMs: Date.now() - startedAt },
      '✅ Scheduled CoT data fetch completed'
    );
  } catch (error) {
    // Swallow the error so the scheduler keeps running for the next tick.
    logger.error({ trigger, error }, '❌ Scheduled CoT data fetch failed');
  } finally {
    isRunning = false;
  }
}

export function startScheduler(): void {
  const schedule = env.DATA_FETCH_CRON;

  if (!cron.validate(schedule)) {
    logger.error(
      { schedule },
      'Invalid DATA_FETCH_CRON expression — scheduler not started. Update the env var to a valid cron expression.'
    );
    return;
  }

  cron.schedule(schedule, () => { void runFetch('cron'); }, { timezone: 'UTC' });

  logger.info({ schedule, timezone: 'UTC' }, '📅 CoT data scheduler started');
}

// Exported for manual/testing use (e.g. an admin "refresh now" endpoint).
export { runFetch };
