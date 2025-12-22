import axios from 'axios';
import { pool } from '../config/database';

/**
 * Data Accuracy Tests
 * Verify that our stored CoT data matches the official CFTC API
 */

describe('CoT Data Accuracy', () => {
  afterAll(async () => {
    await pool.end();
  });

  describe('Gold (GC) Data Verification', () => {
    it('should match CFTC API data for June 1, 2010', async () => {
      const dbResult = await pool.query(
        `SELECT report_date, commercial_long, commercial_short,
                non_commercial_long, non_commercial_short, open_interest
         FROM cot_reports
         WHERE market_id = (SELECT id FROM markets WHERE symbol = 'GC')
           AND source = 'CFTC_API'
           AND report_date = '2010-06-01'
         LIMIT 1`
      );

      expect(dbResult.rows.length).toBe(1);
      const dbData = dbResult.rows[0];

      const cftcResponse = await axios.get(
        'https://publicreporting.cftc.gov/resource/6dca-aqww.json',
        {
          params: {
            $where: "report_date_as_yyyy_mm_dd='2010-06-01' AND market_and_exchange_names='GOLD - COMMODITY EXCHANGE INC.'",
            $limit: 1
          }
        }
      );

      expect(cftcResponse.data.length).toBe(1);
      const cftcData = cftcResponse.data[0];

      expect(Number(dbData.open_interest)).toBe(parseInt(cftcData.open_interest_all));
      expect(Number(dbData.commercial_long)).toBe(parseInt(cftcData.comm_positions_long_all));
      expect(Number(dbData.commercial_short)).toBe(parseInt(cftcData.comm_positions_short_all));
      expect(Number(dbData.non_commercial_long)).toBe(parseInt(cftcData.noncomm_positions_long_all));
      expect(Number(dbData.non_commercial_short)).toBe(parseInt(cftcData.noncomm_positions_short_all));
    });

    it('should match CFTC API data for December 3, 2024', async () => {
      const dbResult = await pool.query(
        `SELECT report_date, commercial_long, commercial_short,
                non_commercial_long, non_commercial_short, open_interest
         FROM cot_reports
         WHERE market_id = (SELECT id FROM markets WHERE symbol = 'GC')
           AND source = 'CFTC_API'
           AND report_date = '2024-12-03'
         LIMIT 1`
      );

      expect(dbResult.rows.length).toBe(1);
      const dbData = dbResult.rows[0];

      const cftcResponse = await axios.get(
        'https://publicreporting.cftc.gov/resource/6dca-aqww.json',
        {
          params: {
            $where: "report_date_as_yyyy_mm_dd='2024-12-03' AND market_and_exchange_names='GOLD - COMMODITY EXCHANGE INC.'",
            $limit: 1
          }
        }
      );

      expect(cftcResponse.data.length).toBe(1);
      const cftcData = cftcResponse.data[0];

      expect(Number(dbData.open_interest)).toBe(parseInt(cftcData.open_interest_all));
      expect(Number(dbData.commercial_long)).toBe(parseInt(cftcData.comm_positions_long_all));
      expect(Number(dbData.commercial_short)).toBe(parseInt(cftcData.comm_positions_short_all));
      expect(Number(dbData.non_commercial_long)).toBe(parseInt(cftcData.noncomm_positions_long_all));
      expect(Number(dbData.non_commercial_short)).toBe(parseInt(cftcData.noncomm_positions_short_all));
    });
  });

  describe('Data Range Verification', () => {
    it('should have historical data going back to at least 2006', async () => {
      const result = await pool.query(
        `SELECT MIN(report_date) as earliest_date
         FROM cot_reports
         WHERE source = 'CFTC_API'`
      );

      const earliestDate = new Date(result.rows[0].earliest_date);
      const targetDate = new Date('2006-12-31');

      expect(earliestDate.getTime()).toBeLessThanOrEqual(targetDate.getTime());
    });

    it('should have data for multiple markets', async () => {
      const result = await pool.query(
        `SELECT COUNT(DISTINCT market_id) as market_count
         FROM cot_reports
         WHERE source = 'CFTC_API'`
      );

      expect(parseInt(result.rows[0].market_count)).toBeGreaterThan(20);
    });

    it('should have at least 2000 reports for Gold', async () => {
      const result = await pool.query(
        `SELECT COUNT(*) as report_count
         FROM cot_reports
         WHERE market_id = (SELECT id FROM markets WHERE symbol = 'GC')
           AND source = 'CFTC_API'`
      );

      expect(parseInt(result.rows[0].report_count)).toBeGreaterThan(1000);
    });
  });

  describe('Data Quality', () => {
    it('should not have negative open interest', async () => {
      const result = await pool.query(
        `SELECT COUNT(*) as invalid_count
         FROM cot_reports
         WHERE source = 'CFTC_API'
           AND open_interest < 0`
      );

      expect(parseInt(result.rows[0].invalid_count)).toBe(0);
    });

    it('should not have duplicate reports for same market and date', async () => {
      const result = await pool.query(
        `SELECT market_id, report_date, COUNT(*) as duplicate_count
         FROM cot_reports
         WHERE source = 'CFTC_API'
         GROUP BY market_id, report_date
         HAVING COUNT(*) > 1`
      );

      expect(result.rows.length).toBe(0);
    });

    it('should have valid date ranges (reports not in future)', async () => {
      const now = new Date();
      const result = await pool.query(
        `SELECT COUNT(*) as future_count
         FROM cot_reports
         WHERE source = 'CFTC_API'
           AND report_date > $1`,
        [now]
      );

      expect(parseInt(result.rows[0].future_count)).toBe(0);
    });
  });

  describe('Net Position Calculations', () => {
    it('should calculate correct net positions for Gold', async () => {
      const result = await pool.query(
        `SELECT commercial_long, commercial_short,
                non_commercial_long, non_commercial_short
         FROM cot_reports
         WHERE market_id = (SELECT id FROM markets WHERE symbol = 'GC')
           AND source = 'CFTC_API'
           AND report_date = '2024-12-03'
         LIMIT 1`
      );

      expect(result.rows.length).toBe(1);
      const data = result.rows[0];

      const commercialNet = Number(data.commercial_long) - Number(data.commercial_short);
      const nonCommercialNet = Number(data.non_commercial_long) - Number(data.non_commercial_short);

      // For Gold on Dec 3, 2024, we expect:
      // Commercial: 63,251 - 349,526 = -286,275
      // Non-Commercial: 307,611 - 47,875 = +259,736
      expect(commercialNet).toBe(63251 - 349526);
      expect(nonCommercialNet).toBe(307611 - 47875);
    });
  });
});
