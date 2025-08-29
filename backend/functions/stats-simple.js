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
    console.log('🔗 Creating stats database connection...');
    pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
      max: 2
    });

    const client = await pool.connect();
    
    console.log('📊 Querying database stats...');
    
    // Simple stats queries - one at a time
    console.log('🔢 Counting total bets...');
    const totalBetsResult = await client.query('SELECT COUNT(*) as count FROM bets');
    console.log('📊 Total bets:', totalBetsResult.rows[0].count);
    
    console.log('📋 Getting categories with stats...');
    const categoriesResult = await client.query(`
      SELECT 
        bc.category_key, 
        bc.display_name, 
        COUNT(b.id) as bet_count, 
        COALESCE(SUM(b.amount::numeric), 0) as total_amount 
      FROM bet_categories bc 
      LEFT JOIN bets b ON bc.category_key = b.category_key 
      GROUP BY bc.category_key, bc.display_name
      ORDER BY bc.category_key
    `);
    console.log('📊 Categories result:', categoriesResult.rows);
    
    const totalBets = parseInt(totalBetsResult.rows[0].count);
    const categories = categoriesResult.rows.map(row => ({
      category_key: row.category_key,
      display_name: row.display_name,
      bet_count: parseInt(row.bet_count),
      total_amount: parseFloat(row.total_amount || 0).toFixed(2)
    }));
    
    const totalPot = categories.reduce((sum, cat) => sum + parseFloat(cat.total_amount), 0);
    const maxPrize = (totalPot / 2).toFixed(2); // Half of total pot
    
    client.release();
    
    const stats = {
      categories,
      totalPot: totalPot.toFixed(2),
      totalBets,
      maxPrize
    };

    console.log('✅ Stats retrieved:', stats);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stats),
    };

  } catch (error) {
    console.error('❌ Stats error:', error);
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
