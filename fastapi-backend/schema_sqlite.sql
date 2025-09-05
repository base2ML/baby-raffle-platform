-- SQLite Multi-Tenant Baby Raffle Schema
-- Simplified version for development with tenant_id columns for isolation

-- Enable foreign keys in SQLite
PRAGMA foreign_keys = ON;

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    contact_email TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'enterprise')),
    settings TEXT DEFAULT '{}' -- JSON string for tenant-specific settings
);

-- Users table  
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    oauth_provider TEXT CHECK (oauth_provider IN ('google', 'apple', 'email')),
    oauth_subject_id TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'moderator')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
    UNIQUE (tenant_id, email)
);

-- Raffle categories table
CREATE TABLE IF NOT EXISTS raffle_categories (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
    UNIQUE (tenant_id, name)
);

-- Bets table
CREATE TABLE IF NOT EXISTS bets (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_validated BOOLEAN DEFAULT FALSE,
    validated_by TEXT,
    validated_at DATETIME,
    notes TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES raffle_categories (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (validated_by) REFERENCES users (id) ON DELETE SET NULL
);

-- OAuth sessions table for token management
CREATE TABLE IF NOT EXISTS oauth_sessions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    access_token_hash TEXT NOT NULL,
    refresh_token_hash TEXT,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'apple')),
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Audit logs for compliance and monitoring
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details TEXT DEFAULT '{}', -- JSON string
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users (tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users (oauth_provider, oauth_subject_id);
CREATE INDEX IF NOT EXISTS idx_bets_tenant_category ON bets (tenant_id, category_id);
CREATE INDEX IF NOT EXISTS idx_bets_user ON bets (user_id);
CREATE INDEX IF NOT EXISTS idx_bets_created_at ON bets (created_at);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_user ON oauth_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_token ON oauth_sessions (access_token_hash);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_action ON audit_logs (tenant_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);

-- Insert a default tenant for development
INSERT OR IGNORE INTO tenants (
    id, 
    company_name, 
    subdomain, 
    contact_email,
    subscription_tier
) VALUES (
    'demo-tenant-001',
    'Demo Baby Raffle',
    'demo',
    'demo@babyraffle.com',
    'free'
);

-- Insert demo admin user
INSERT OR IGNORE INTO users (
    id,
    tenant_id,
    email,
    full_name,
    oauth_provider,
    role
) VALUES (
    'demo-admin-001',
    'demo-tenant-001',
    'admin@demo.babyraffle.com',
    'Demo Administrator',
    'email',
    'admin'
);

-- Payment and billing tables
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled', 'processing', 'requires_action')),
    description TEXT,
    metadata TEXT DEFAULT '{}', -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL CHECK (plan IN ('trial', 'basic', 'premium')),
    status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid')),
    current_period_start DATETIME NOT NULL,
    current_period_end DATETIME NOT NULL,
    trial_end DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

-- File management tables
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    url TEXT NOT NULL,
    size INTEGER NOT NULL CHECK (size > 0),
    content_type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS slideshow_images (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    file_id TEXT NOT NULL,
    title TEXT,
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
);

-- Site configuration tables
CREATE TABLE IF NOT EXISTS site_configs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT UNIQUE NOT NULL,
    config TEXT DEFAULT '{}', -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deployments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'building', 'success', 'failed')),
    deployment_url TEXT,
    build_log TEXT,
    force_rebuild BOOLEAN DEFAULT FALSE,
    config_only BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

-- Add stripe_customer_id to tenants table
ALTER TABLE tenants ADD COLUMN stripe_customer_id TEXT;

-- Create additional indexes for new tables
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments (stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions (stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (status);

CREATE INDEX IF NOT EXISTS idx_files_tenant ON files (tenant_id);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files (created_at);

CREATE INDEX IF NOT EXISTS idx_slideshow_tenant_active ON slideshow_images (tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_slideshow_display_order ON slideshow_images (display_order);

CREATE INDEX IF NOT EXISTS idx_site_configs_tenant ON site_configs (tenant_id);

CREATE INDEX IF NOT EXISTS idx_deployments_tenant ON deployments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments (status);
CREATE INDEX IF NOT EXISTS idx_deployments_created_at ON deployments (created_at);