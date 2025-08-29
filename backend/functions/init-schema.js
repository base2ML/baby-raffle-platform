const { Pool } = require('pg');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  let pool = null;

  try {
    console.log('🔗 Creating database connection with:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USERNAME
    });
    
    pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000
    });

    console.log('🔗 Connecting to database...');
    const client = await pool.connect();
    
    console.log('📋 Creating tables...');
    
    // Create bet_categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bet_categories (
        id SERIAL PRIMARY KEY,
        category_key VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        bet_price DECIMAL(10,2) DEFAULT 5.00,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create bets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bets (
        id SERIAL PRIMARY KEY,
        user_name VARCHAR(100) NOT NULL,
        user_email VARCHAR(100) NOT NULL,
        user_phone VARCHAR(20),
        category_key VARCHAR(50) NOT NULL,
        bet_value TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        validated BOOLEAN DEFAULT false,
        payment_reference VARCHAR(100),
        venmo_transaction_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        validated_at TIMESTAMP,
        validated_by VARCHAR(100)
      );
    `);
    
    // Create category_totals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS category_totals (
        category_key VARCHAR(50) PRIMARY KEY,
        total_amount DECIMAL(10,2) DEFAULT 0,
        bet_count INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('📝 Inserting default categories...');
    
    // Insert default categories
    await client.query(`
      INSERT INTO bet_categories (category_key, display_name, description) VALUES 
      ('birth_date', 'Birth Date', 'When will baby arrive?'),
      ('birth_weight', 'Birth Weight', 'How much will baby weigh?'),
      ('birth_length', 'Birth Length', 'How long will baby be?')
      ON CONFLICT (category_key) DO NOTHING;
    `);
    
    // Insert category totals
    await client.query(`
      INSERT INTO category_totals (category_key) VALUES 
      ('birth_date'), ('birth_weight'), ('birth_length')
      ON CONFLICT (category_key) DO NOTHING;
    `);
    
    console.log('✅ Database schema initialized successfully!');
    
    client.release();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Database schema initialized successfully!'
      }),
    };

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      }),
    };
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};
