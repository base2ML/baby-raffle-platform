const { getDatabase } = require('../lib/db');
const { bets, categoryTotals, betCategories } = require('../lib/schema');
const { eq, sql } = require('drizzle-orm');

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    const db = await getDatabase();

    // Get overall stats
    const totalBetsResult = await db
      .select({ count: sql`count(*)` })
      .from(bets);
    
    const validatedBetsResult = await db
      .select({ count: sql`count(*)` })
      .from(bets)
      .where(eq(bets.validated, true));

    const totalAmountResult = await db
      .select({ total: sql`sum(CAST(amount AS DECIMAL))` })
      .from(bets);

    const validatedAmountResult = await db
      .select({ total: sql`sum(CAST(amount AS DECIMAL))` })
      .from(bets)
      .where(eq(bets.validated, true));

    // Get category stats
    const categoryStats = await db
      .select({
        categoryKey: betCategories.categoryKey,
        displayName: betCategories.displayName,
        totalAmount: categoryTotals.totalAmount,
        betCount: categoryTotals.betCount,
        betPrice: betCategories.betPrice,
      })
      .from(betCategories)
      .leftJoin(categoryTotals, eq(betCategories.categoryKey, categoryTotals.categoryKey))
      .where(eq(betCategories.isActive, true));

    const stats = {
      totals: {
        totalBets: parseInt(totalBetsResult[0]?.count || 0),
        validatedBets: parseInt(validatedBetsResult[0]?.count || 0),
        totalAmount: parseFloat(totalAmountResult[0]?.total || 0),
        validatedAmount: parseFloat(validatedAmountResult[0]?.total || 0),
      },
      categories: categoryStats.map(cat => ({
        ...cat,
        totalAmount: parseFloat(cat.totalAmount || 0),
        betCount: parseInt(cat.betCount || 0),
        winnerPrize: parseFloat(cat.totalAmount || 0) * 0.5, // 50% to winner
      }))
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stats),
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
