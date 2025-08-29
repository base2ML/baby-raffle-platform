const { Pool } = require('pg');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    console.log('🔗 Creating test database connection...');
    pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 5000,
      max: 1 // Only one connection
    });

    console.log('📡 Connecting to database...');
    const client = await pool.connect();
    
    console.log('🧪 Testing basic query...');
    const result = await client.query('SELECT 1 as test');
    console.log('✅ Basic query result:', result.rows);
    
    console.log('📋 Checking tables...');
    const tablesResult = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('📋 Tables found:', tablesResult.rows);
    
    console.log('🔢 Counting bets...');
    const countResult = await client.query('SELECT COUNT(*) as count FROM bets');
    console.log('🔢 Bet count:', countResult.rows);
    
    client.release();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        tables: tablesResult.rows,
        betCount: countResult.rows[0].count,
        testQuery: result.rows[0].test
      }),
    };

  } catch (error) {
    console.error('❌ Test error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
    };
  } finally {
    if (pool) {
      console.log('🔌 Closing pool...');
      await pool.end();
    }
  }
};
