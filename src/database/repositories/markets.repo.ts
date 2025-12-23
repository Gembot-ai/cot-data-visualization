import { pool } from '../../config/database';
import { Market } from '../../types/cot.types';
import { logger } from '../../utils/logger';

export class MarketsRepository {
  async findAll(): Promise<Market[]> {
    const result = await pool.query<Market>(
      'SELECT * FROM markets WHERE active = true ORDER BY symbol'
    );
    return result.rows;
  }

  async findBySymbol(symbol: string): Promise<Market | null> {
    const result = await pool.query<Market>(
      'SELECT * FROM markets WHERE symbol = $1',
      [symbol]
    );
    return result.rows[0] || null;
  }

  async findById(id: number): Promise<Market | null> {
    const result = await pool.query<Market>(
      'SELECT * FROM markets WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByCategory(category: string): Promise<Market[]> {
    const result = await pool.query<Market>(
      'SELECT * FROM markets WHERE category = $1 AND active = true ORDER BY symbol',
      [category]
    );
    return result.rows;
  }

  async create(market: Omit<Market, 'id' | 'created_at' | 'updated_at'>): Promise<Market> {
    const result = await pool.query<Market>(
      `INSERT INTO markets (symbol, name, category, exchange, description, contract_unit, tick_size, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        market.symbol,
        market.name,
        market.category,
        market.exchange,
        market.description,
        market.contract_unit,
        market.tick_size,
        market.active
      ]
    );
    return result.rows[0];
  }

  async update(id: number, market: Partial<Market>): Promise<Market | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(market).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const result = await pool.query<Market>(
      `UPDATE markets SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async initializeMarkets(markets: Array<Omit<Market, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const market of markets) {
        await client.query(
          `INSERT INTO markets (symbol, name, category, exchange, description, contract_unit, tick_size, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (symbol) DO UPDATE
           SET name = EXCLUDED.name,
               category = EXCLUDED.category,
               exchange = EXCLUDED.exchange,
               description = EXCLUDED.description,
               contract_unit = EXCLUDED.contract_unit,
               tick_size = EXCLUDED.tick_size,
               updated_at = CURRENT_TIMESTAMP`,
          [
            market.symbol,
            market.name,
            market.category,
            market.exchange,
            market.description,
            market.contract_unit,
            market.tick_size,
            market.active
          ]
        );
      }

      await client.query('COMMIT');
      logger.info({ count: markets.length }, 'Markets initialized/updated');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error({ error }, 'Failed to initialize markets');
      throw error;
    } finally {
      client.release();
    }
  }
}
