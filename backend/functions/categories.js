const { getDatabase } = require('../lib/db');
const { betCategories, categoryTotals } = require('../lib/schema');
const { eq } = require('drizzle-orm');

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
      // Fetch categories with totals
      const categories = await db
        .select({
          id: betCategories.id,
          categoryKey: betCategories.categoryKey,
          displayName: betCategories.displayName,
          description: betCategories.description,
          betPrice: betCategories.betPrice,
          isActive: betCategories.isActive,
          totalAmount: categoryTotals.totalAmount,
          betCount: categoryTotals.betCount,
        })
        .from(betCategories)
        .leftJoin(categoryTotals, eq(betCategories.categoryKey, categoryTotals.categoryKey))
        .where(eq(betCategories.isActive, true));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ categories }),
      };
    }

    if (event.httpMethod === 'POST') {
      // Create new category
      const body = JSON.parse(event.body);
      const { categoryKey, displayName, description, betPrice } = body;

      if (!categoryKey || !displayName) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'categoryKey and displayName are required' }),
        };
      }

      const newCategory = await db.insert(betCategories).values({
        categoryKey,
        displayName,
        description: description || null,
        betPrice: betPrice || '5.00',
        isActive: true,
      }).returning();

      // Initialize category totals
      await db.insert(categoryTotals).values({
        categoryKey,
        totalAmount: '0',
        betCount: 0,
      });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ category: newCategory[0] }),
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
