const { pgTable, serial, varchar, decimal, boolean, timestamp, integer } = require('drizzle-orm/pg-core');

const betCategories = pgTable('bet_categories', {
  id: serial('id').primaryKey(),
  categoryKey: varchar('category_key', { length: 50 }).unique().notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  description: varchar('description', { length: 255 }),
  betPrice: decimal('bet_price', { precision: 10, scale: 2 }).default('5.00'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

const bets = pgTable('bets', {
  id: serial('id').primaryKey(),
  userName: varchar('user_name', { length: 100 }).notNull(),
  userEmail: varchar('user_email', { length: 255 }).notNull(),
  userPhone: varchar('user_phone', { length: 20 }),
  categoryKey: varchar('category_key', { length: 50 }).references(() => betCategories.categoryKey),
  betValue: varchar('bet_value', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  validated: boolean('validated').default(false),
  paymentReference: varchar('payment_reference', { length: 255 }),
  venmoTransactionId: varchar('venmo_transaction_id', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  validatedAt: timestamp('validated_at'),
  validatedBy: varchar('validated_by', { length: 100 }),
});

const categoryTotals = pgTable('category_totals', {
  categoryKey: varchar('category_key', { length: 50 }).primaryKey().references(() => betCategories.categoryKey),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).default('0'),
  betCount: integer('bet_count').default(0),
  lastUpdated: timestamp('last_updated').defaultNow(),
});

module.exports = {
  betCategories,
  bets,
  categoryTotals
};