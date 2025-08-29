const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

let pool = null;
let db = null;

async function getDatabaseCredentials() {
  // If DB environment variables are set, use them directly
  if (process.env.DB_HOST && process.env.DB_PASSWORD) {
    return {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      dbname: process.env.DB_NAME || 'babyraffle',
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD
    };
  }

  // In production, get credentials from AWS Secrets Manager
  const secretName = process.env.DATABASE_SECRET_NAME || 'margojones/database/connection';
  const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });
  
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await client.send(command);
    
    if (!response.SecretString) {
      throw new Error('No secret string found');
    }
    
    return JSON.parse(response.SecretString);
  } catch (error) {
    console.error('Failed to retrieve database credentials:', error);
    throw error;
  }
}

async function getDatabase() {
  if (db && pool) {
    return db;
  }

  try {
    const credentials = await getDatabaseCredentials();
    
    pool = new Pool({
      host: credentials.host,
      port: credentials.port,
      database: credentials.dbname,
      user: credentials.username,
      password: credentials.password,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    db = drizzle(pool);
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// For cleanup in serverless environments
async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

module.exports = { getDatabase, closeDatabase };