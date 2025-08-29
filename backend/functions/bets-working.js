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
      const betsResult = await client.query(`
        SELECT b.*, bc.display_name as category_display_name 
        FROM bets b 
        LEFT JOIN bet_categories bc ON b.category_key = bc.category_key 
        ORDER BY b.created_at DESC
      `);
      
      client.release();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ bets: betsResult.rows }),
      };
    }

    if (event.httpMethod === 'POST') {
      const userData = JSON.parse(event.body);
      const { userName, userEmail, userPhone, bets } = userData;
      
      console.log('Creating bets for user:', userName);
      
      const createdBets = [];
      
      for (const bet of bets) {
        const paymentReference = `${userName}-${Date.now()}`;
        
        const result = await client.query(`
          INSERT INTO bets (user_name, user_email, user_phone, category_key, bet_value, amount, validated, payment_reference)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [userName, userEmail, userPhone, bet.categoryKey, bet.betValue, bet.amount, false, paymentReference]);
        
        createdBets.push(result.rows[0]);
      }
      
      client.release();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Bets created successfully',
          bets: createdBets,
          betIds: createdBets.map(bet => bet.id)
        }),
      };
    }

  } catch (error) {
    console.error('Bets error:', error);
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
