const { getDatabase } = require('../lib/db');
const { bets, categoryTotals } = require('../lib/schema');
const { eq, sql } = require('drizzle-orm');

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const db = await getDatabase();

    if (event.httpMethod === 'GET') {
      // Handle GET request - fetch bets
      const queryParams = event.queryStringParameters || {};
      const validated = queryParams.validated;
      
      let query = db.select().from(bets);
      
      if (validated === 'true') {
        query = query.where(eq(bets.validated, true));
      } else if (validated === 'false') {
        query = query.where(eq(bets.validated, false));
      }
      
      const allBets = await query.orderBy(bets.createdAt);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ bets: allBets }),
      };
    }

    if (event.httpMethod === 'POST') {
      // Handle POST request - create bets
      const body = JSON.parse(event.body);
      const { userName, userEmail, userPhone, bets: userBets } = body;

      if (!userName || !userEmail || !userBets || !Array.isArray(userBets)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid request data' }),
        };
      }

      // Insert all bets
      const insertedBets = [];
      for (const bet of userBets) {
        if (!bet.categoryKey || !bet.betValue || !bet.amount) {
          continue;
        }
        
        const newBet = await db.insert(bets).values({
          userName,
          userEmail,
          userPhone: userPhone || null,
          categoryKey: bet.categoryKey,
          betValue: bet.betValue,
          amount: bet.amount.toString(),
          validated: false,
          paymentReference: `${userName}-${Date.now()}`,
        }).returning();
        
        insertedBets.push(newBet[0]);
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ 
          bets: insertedBets, 
          message: 'Bets submitted successfully' 
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
