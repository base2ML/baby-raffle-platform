// Temporary admin function that bypasses database
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    const { password, betIds = [] } = JSON.parse(event.body);

    // Simple password check (in real implementation, this would be more secure)
    if (password !== 'admin123') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid password' }),
      };
    }

    if (betIds.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'betIds array is required' }),
      };
    }

    // Simulate successful validation
    console.log('✅ Admin validating bets (temporary handler):', betIds);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Successfully validated ${betIds.length} bets (Note: Using temporary handler)`,
        validatedBets: betIds
      }),
    };

  } catch (error) {
    console.error('Admin error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
