CREATE TABLE IF NOT EXISTS bet_categories (
  id SERIAL PRIMARY KEY,
  category_key VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  bet_price DECIMAL(10,2) DEFAULT 5.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bets (
  id SERIAL PRIMARY KEY,
  user_name VARCHAR(100) NOT NULL,
  user_email VARCHAR(100) NOT NULL,
  user_phone VARCHAR(20),
  category_key VARCHAR(50) NOT NULL,
  bet_value TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  validated BOOLEAN DEFAULT false,
  payment_reference VARCHAR(100),
  venmo_transaction_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  validated_at TIMESTAMP,
  validated_by VARCHAR(100),
  FOREIGN KEY (category_key) REFERENCES bet_categories(category_key)
);

CREATE TABLE IF NOT EXISTS category_totals (
  category_key VARCHAR(50) PRIMARY KEY,
  total_amount DECIMAL(10,2) DEFAULT 0,
  bet_count INTEGER DEFAULT 0,
  FOREIGN KEY (category_key) REFERENCES bet_categories(category_key)
);
