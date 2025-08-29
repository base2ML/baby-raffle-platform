const { Pool } = require('pg');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  let pool = null;

  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    const { password, betIds = [] } = JSON.parse(event.body);

    // Simple password check
    if (password !== 'admin123') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid password' }),
      };
    }

    if (betIds.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'betIds array is required' }),
      };
    }

    pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
      max: 2
    });

    const client = await pool.connect();

    // Update bets to validated
    const placeholders = betIds.map((_, index) => `$${index + 1}`).join(',');
    const result = await client.query(`
      UPDATE bets 
      SET validated = true, validated_at = CURRENT_TIMESTAMP, validated_by = 'admin'
      WHERE id IN (${placeholders})
      RETURNING *
    `, betIds);

    client.release();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Successfully validated ${result.rows.length} bets`,
        validatedBets: result.rows
      }),
    };

  } catch (error) {
    console.error('Admin error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};
