import { pool } from '../../config/database';
import { CotReport } from '../../types/cot.types';
import { logger } from '../../utils/logger';

export class CotReportsRepository {
  async findLatestByMarket(marketId: number): Promise<CotReport | null> {
    const result = await pool.query<CotReport>(
      `SELECT * FROM cot_reports
       WHERE market_id = $1
       ORDER BY
         CASE WHEN source = 'CFTC_API' THEN 1 ELSE 2 END,
         report_date DESC
       LIMIT 1`,
      [marketId]
    );
    return result.rows[0] || null;
  }

  async findByMarketAndDateRange(
    marketId: number,
    startDate: Date,
    endDate: Date
  ): Promise<CotReport[]> {
    const result = await pool.query<CotReport>(
      `SELECT * FROM cot_reports
       WHERE market_id = $1
       AND report_date >= $2
       AND report_date <= $3
       ORDER BY report_date DESC`,
      [marketId, startDate, endDate]
    );
    return result.rows;
  }

  async findHistoricalByMarket(
    marketId: number,
    weeks?: number
  ): Promise<CotReport[]> {
    const query = weeks
      ? `SELECT * FROM cot_reports
         WHERE market_id = $1
         ORDER BY report_date DESC
         LIMIT $2`
      : `SELECT * FROM cot_reports
         WHERE market_id = $1
         ORDER BY report_date DESC`;

    const params = weeks ? [marketId, weeks] : [marketId];
    const result = await pool.query<CotReport>(query, params);
    return result.rows;
  }

  async findLatestForAllMarkets(): Promise<CotReport[]> {
    const result = await pool.query<CotReport>(
      `SELECT DISTINCT ON (market_id) *
       FROM cot_reports
       ORDER BY market_id, report_date DESC`
    );
    return result.rows;
  }

  async create(report: Omit<CotReport, 'id' | 'created_at' | 'updated_at'>): Promise<CotReport> {
    const result = await pool.query<CotReport>(
      `INSERT INTO cot_reports (
        market_id, report_date, publish_date,
        commercial_long, commercial_short, commercial_spreading,
        num_commercial_long, num_commercial_short,
        non_commercial_long, non_commercial_short, non_commercial_spreading,
        num_non_commercial_long, num_non_commercial_short,
        non_reportable_long, non_reportable_short,
        num_non_reportable_long, num_non_reportable_short,
        commercial_long_change, commercial_short_change,
        non_commercial_long_change, non_commercial_short_change,
        open_interest,
        swap_dealers_long, swap_dealers_short,
        managed_money_long, managed_money_short,
        other_reportable_long, other_reportable_short,
        source, data_quality_score
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
      )
      RETURNING *`,
      [
        report.market_id,
        report.report_date,
        report.publish_date,
        report.commercial_long,
        report.commercial_short,
        report.commercial_spreading,
        report.num_commercial_long,
        report.num_commercial_short,
        report.non_commercial_long,
        report.non_commercial_short,
        report.non_commercial_spreading,
        report.num_non_commercial_long,
        report.num_non_commercial_short,
        report.non_reportable_long,
        report.non_reportable_short,
        report.num_non_reportable_long,
        report.num_non_reportable_short,
        report.commercial_long_change,
        report.commercial_short_change,
        report.non_commercial_long_change,
        report.non_commercial_short_change,
        report.open_interest,
        report.swap_dealers_long,
        report.swap_dealers_short,
        report.managed_money_long,
        report.managed_money_short,
        report.other_reportable_long,
        report.other_reportable_short,
        report.source,
        report.data_quality_score
      ]
    );
    return result.rows[0];
  }

  async bulkCreate(reports: Omit<CotReport, 'id' | 'created_at' | 'updated_at'>[]): Promise<number> {
    const client = await pool.connect();
    let inserted = 0;

    try {
      await client.query('BEGIN');

      for (const report of reports) {
        await client.query(
          `INSERT INTO cot_reports (
            market_id, report_date, publish_date,
            commercial_long, commercial_short,
            non_commercial_long, non_commercial_short,
            open_interest, source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            report.market_id,
            report.report_date,
            report.publish_date,
            report.commercial_long,
            report.commercial_short,
            report.non_commercial_long,
            report.non_commercial_short,
            report.open_interest,
            report.source || 'CFTC_API'
          ]
        );
        inserted++;
      }

      await client.query('COMMIT');
      logger.info({ inserted }, 'Bulk insert completed');
      return inserted;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error({ error }, 'Bulk insert failed');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: number): Promise<CotReport | null> {
    const result = await pool.query<CotReport>(
      'SELECT * FROM cot_reports WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }
}
