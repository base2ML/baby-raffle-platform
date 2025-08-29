// Temporary betting function that bypasses database
// This allows frontend testing while we fix the database connectivity

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

  try {
    if (event.httpMethod === 'GET') {
      // Return fake bets for testing
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          bets: [
            {
              id: 1,
              user_name: "Test User",
              user_email: "test@example.com", 
              category_key: "birth_date",
              bet_value: "March 15, 2024",
              amount: "5.00",
              validated: false,
              created_at: new Date().toISOString()
            }
          ]
        }),
      };
    }

    if (event.httpMethod === 'POST') {
      const userData = JSON.parse(event.body);
      
      console.log('✅ Received bet submission (temporary handler):', userData);
      
      // Simulate successful bet creation
      const response = {
        success: true,
        message: 'Bets submitted successfully! (Note: Using temporary handler while database is being configured)',
        betIds: userData.bets.map((_, index) => index + 1),
        totalAmount: userData.bets.reduce((sum, bet) => sum + bet.amount, 0)
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response),
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
