const { Pool } = require('pg');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    if (event.httpMethod === 'GET') {
      const result = await client.query(`
        SELECT * FROM bet_categories 
        WHERE is_active = true 
        ORDER BY id
      `);
      
      client.release();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ categories: result.rows }),
      };
    }

  } catch (error) {
    console.error('Categories error:', error);
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
