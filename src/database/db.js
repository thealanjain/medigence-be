const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  console.log('✅ Database connected');
});

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err.message);
});

/**
 * Execute a single query
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB] query=${text.substring(0, 60)}... duration=${duration}ms rows=${result.rowCount}`);
    }
    return result;
  } catch (error) {
    console.error('[DB] Query error:', error.message);
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
