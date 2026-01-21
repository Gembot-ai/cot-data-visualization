import axios from 'axios';
import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { CFTC_CONTRACT_CODES } from '../config/cftc-contract-codes';

/**
 * Validate COT data in our database against the official CFTC API
 * This script compares our stored data with the CFTC source to ensure accuracy
 *
 * Usage: npm run validate-data
 */

const CFTC_API_BASE = 'https://publicreporting.cftc.gov/resource/6dca-aqww.json';

interface CFTCRecord {
  cftc_contract_market_code: string;
  market_and_exchange_names: string;
  report_date_as_yyyy_mm_dd: string;
  open_interest_all: string;
  comm_positions_long_all: string;
  comm_positions_short_all: string;
  noncomm_positions_long_all: string;
  noncomm_positions_short_all: string;
  nonrept_positions_long_all: string;
  nonrept_positions_short_all: string;
}

interface ValidationResult {
  symbol: string;
  cftcCode: string;
  reportDate: string;
  field: string;
  ourValue: number;
  cftcValue: number;
  difference: number;
  percentDiff: number;
}

async function validateCotData() {
  const errors: ValidationResult[] = [];
  const validated: string[] = [];

  try {
    logger.info('Starting COT data validation against CFTC API...');

    // Get the latest report date from CFTC
    const latestResponse = await axios.get(CFTC_API_BASE, {
      params: {
        '$limit': 1,
        '$order': 'report_date_as_yyyy_mm_dd DESC',
        '$select': 'report_date_as_yyyy_mm_dd'
      }
    });

    const latestCftcDate = latestResponse.data[0]?.report_date_as_yyyy_mm_dd?.split('T')[0];
    logger.info({ latestCftcDate }, 'Latest CFTC report date');

    // Get all our markets with CFTC codes
    const marketsResult = await pool.query(`
      SELECT id, symbol, name FROM markets WHERE active = true
    `);

    for (const market of marketsResult.rows) {
      const cftcCode = CFTC_CONTRACT_CODES[market.symbol];

      if (!cftcCode) {
        logger.warn({ symbol: market.symbol }, 'No CFTC code configured - skipping validation');
        continue;
      }

      logger.info({ symbol: market.symbol, cftcCode }, 'Validating market...');

      // Fetch latest data from CFTC for this contract
      const cftcResponse = await axios.get(CFTC_API_BASE, {
        params: {
          '$where': `cftc_contract_market_code = '${cftcCode}'`,
          '$order': 'report_date_as_yyyy_mm_dd DESC',
          '$limit': 1
        }
      });

      const cftcRecord: CFTCRecord = cftcResponse.data[0];

      if (!cftcRecord) {
        logger.warn({ symbol: market.symbol, cftcCode }, 'No CFTC data found for contract code');
        continue;
      }

      const cftcDate = cftcRecord.report_date_as_yyyy_mm_dd.split('T')[0];

      // Fetch our data for the same date
      const ourResult = await pool.query(`
        SELECT
          commercial_long, commercial_short,
          non_commercial_long, non_commercial_short,
          non_reportable_long, non_reportable_short,
          open_interest
        FROM cot_reports
        WHERE market_id = $1 AND report_date = $2
      `, [market.id, cftcDate]);

      if (ourResult.rows.length === 0) {
        logger.warn({
          symbol: market.symbol,
          cftcCode,
          date: cftcDate,
          cftcMarketName: cftcRecord.market_and_exchange_names
        }, 'No data in our database for this date');
        continue;
      }

      const ourData = ourResult.rows[0];

      // Compare fields
      const comparisons = [
        { field: 'open_interest', ours: Number(ourData.open_interest), cftc: parseInt(cftcRecord.open_interest_all) },
        { field: 'commercial_long', ours: Number(ourData.commercial_long), cftc: parseInt(cftcRecord.comm_positions_long_all) },
        { field: 'commercial_short', ours: Number(ourData.commercial_short), cftc: parseInt(cftcRecord.comm_positions_short_all) },
        { field: 'non_commercial_long', ours: Number(ourData.non_commercial_long), cftc: parseInt(cftcRecord.noncomm_positions_long_all) },
        { field: 'non_commercial_short', ours: Number(ourData.non_commercial_short), cftc: parseInt(cftcRecord.noncomm_positions_short_all) },
        { field: 'non_reportable_long', ours: Number(ourData.non_reportable_long || 0), cftc: parseInt(cftcRecord.nonrept_positions_long_all || '0') },
        { field: 'non_reportable_short', ours: Number(ourData.non_reportable_short || 0), cftc: parseInt(cftcRecord.nonrept_positions_short_all || '0') },
      ];

      let hasErrors = false;

      for (const { field, ours, cftc } of comparisons) {
        const diff = Math.abs(ours - cftc);
        const percentDiff = cftc !== 0 ? (diff / cftc) * 100 : (ours !== 0 ? 100 : 0);

        // Flag if difference is > 1% or absolute difference > 100
        if (percentDiff > 1 || diff > 100) {
          hasErrors = true;
          errors.push({
            symbol: market.symbol,
            cftcCode,
            reportDate: cftcDate,
            field,
            ourValue: ours,
            cftcValue: cftc,
            difference: diff,
            percentDiff: Math.round(percentDiff * 100) / 100
          });
        }
      }

      if (!hasErrors) {
        validated.push(market.symbol);
        logger.info({
          symbol: market.symbol,
          date: cftcDate,
          openInterest: ourData.open_interest,
          cftcMarketName: cftcRecord.market_and_exchange_names
        }, '✅ Data matches CFTC');
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(80));

    if (validated.length > 0) {
      console.log(`\n✅ VALIDATED (${validated.length} markets):`);
      console.log(`   ${validated.join(', ')}`);
    }

    if (errors.length > 0) {
      console.log(`\n❌ ERRORS FOUND (${errors.length} discrepancies):`);
      console.log('-'.repeat(80));

      // Group errors by symbol
      const errorsBySymbol = errors.reduce((acc, err) => {
        if (!acc[err.symbol]) acc[err.symbol] = [];
        acc[err.symbol].push(err);
        return acc;
      }, {} as Record<string, ValidationResult[]>);

      for (const [symbol, symbolErrors] of Object.entries(errorsBySymbol)) {
        console.log(`\n${symbol} (CFTC Code: ${symbolErrors[0].cftcCode}):`);
        for (const err of symbolErrors) {
          console.log(`  ${err.field}:`);
          console.log(`    Our DB:  ${err.ourValue.toLocaleString()}`);
          console.log(`    CFTC:    ${err.cftcValue.toLocaleString()}`);
          console.log(`    Diff:    ${err.difference.toLocaleString()} (${err.percentDiff}%)`);
        }
      }

      console.log('\n' + '-'.repeat(80));
      console.log('ACTION REQUIRED: Run "npm run refetch-all" to fix incorrect data');
    } else {
      console.log('\n✅ ALL DATA VALIDATED SUCCESSFULLY!');
    }

    console.log('='.repeat(80) + '\n');

    return { validated, errors };

  } catch (error) {
    logger.error({ error }, 'Validation failed');
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  validateCotData()
    .then(({ errors }) => {
      process.exit(errors.length > 0 ? 1 : 0);
    })
    .catch(() => {
      process.exit(1);
    });
}

export { validateCotData };
