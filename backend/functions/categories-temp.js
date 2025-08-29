// Temporary categories function that returns static data
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
      // Return static categories for testing
      const categories = [
        {
          id: 1,
          category_key: 'birth_date',
          display_name: 'Birth Date',
          description: 'When will baby arrive?',
          bet_price: '5.00',
          is_active: true
        },
        {
          id: 2,
          category_key: 'birth_weight',
          display_name: 'Birth Weight',
          description: 'How much will baby weigh?',
          bet_price: '5.00',
          is_active: true
        },
        {
          id: 3,
          category_key: 'birth_length',
          display_name: 'Birth Length',
          description: 'How long will baby be?',
          bet_price: '5.00',
          is_active: true
        }
      ];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ categories }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error) {
    console.error('Categories error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
