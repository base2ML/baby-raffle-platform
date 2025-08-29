const { getDatabase } = require('../lib/db');
const { bets, categoryTotals } = require('../lib/schema');
const { eq, inArray, sql } = require('drizzle-orm');

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    const db = await getDatabase();
    const body = JSON.parse(event.body);
    const { betIds, validatedBy } = body;

    if (!betIds || !Array.isArray(betIds) || betIds.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'betIds array is required' }),
      };
    }

    // Update bets as validated
    const updatedBets = await db
      .update(bets)
      .set({
        validated: true,
        validatedAt: new Date(),
        validatedBy: validatedBy || 'admin',
      })
      .where(inArray(bets.id, betIds))
      .returning();

    // Update category totals for validated bets
    const categoryUpdates = {};
    
    for (const bet of updatedBets) {
      if (!categoryUpdates[bet.categoryKey]) {
        categoryUpdates[bet.categoryKey] = {
          totalAmount: 0,
          betCount: 0,
        };
      }
      categoryUpdates[bet.categoryKey].totalAmount += parseFloat(bet.amount);
      categoryUpdates[bet.categoryKey].betCount += 1;
    }

    // Update category totals in database
    for (const [categoryKey, updates] of Object.entries(categoryUpdates)) {
      await db
        .update(categoryTotals)
        .set({
          totalAmount: sql`${categoryTotals.totalAmount} + ${updates.totalAmount}`,
          betCount: sql`${categoryTotals.betCount} + ${updates.betCount}`,
          lastUpdated: new Date(),
        })
        .where(eq(categoryTotals.categoryKey, categoryKey));
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: `${updatedBets.length} bets validated successfully`,
        validatedBets: updatedBets,
      }),
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
