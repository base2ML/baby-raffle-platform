// Temporary stats function that returns static data
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

  try {
    if (event.httpMethod === 'GET') {
      // Return fake stats for testing
      const stats = {
        categories: [
          {
            category_key: 'birth_date',
            display_name: 'Birth Date',
            total_amount: '45.00',
            bet_count: 9
          },
          {
            category_key: 'birth_weight',
            display_name: 'Birth Weight',
            total_amount: '35.00',
            bet_count: 7
          },
          {
            category_key: 'birth_length',
            display_name: 'Birth Length',
            total_amount: '25.00',
            bet_count: 5
          }
        ],
        totalPot: '105.00',
        totalBets: 21,
        maxPrize: '52.50' // Half of total pot
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(stats),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error) {
    console.error('Stats error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
