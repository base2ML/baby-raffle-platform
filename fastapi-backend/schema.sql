-- Multi-tenant Baby Raffle SaaS Database Schema
-- PostgreSQL 15+ with Row-Level Security

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Core tenant management table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subdomain VARCHAR(63) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'trial' CHECK (status IN ('active', 'suspended', 'trial', 'inactive')),
    subscription_plan VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT valid_subdomain CHECK (
        subdomain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$' AND 
        LENGTH(subdomain) >= 3 AND 
        LENGTH(subdomain) <= 63
    )
);

-- Users table with tenant isolation
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    oauth_provider VARCHAR(50), -- 'google', 'apple', 'email'
    oauth_id VARCHAR(255),
    password_hash VARCHAR(255), -- for email auth
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'user')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Unique constraints
    UNIQUE(tenant_id, email),
    UNIQUE(oauth_provider, oauth_id) -- Global uniqueness for OAuth
);

-- Raffle categories per tenant
CREATE TABLE IF NOT EXISTS raffle_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_key VARCHAR(50) NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    bet_price DECIMAL(10, 2) DEFAULT 5.00 CHECK (bet_price > 0),
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraints
    UNIQUE(tenant_id, category_key)
);

-- User bets with tenant isolation
CREATE TABLE IF NOT EXISTS bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES raffle_categories(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    bet_value VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    is_validated BOOLEAN DEFAULT false,
    validated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    validated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_reference VARCHAR(255),
    
    -- Ensure category belongs to same tenant
    FOREIGN KEY (tenant_id, category_id) REFERENCES raffle_categories(tenant_id, id)
);

-- OAuth sessions and tokens
CREATE TABLE IF NOT EXISTS oauth_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Index for cleanup
    INDEX (expires_at)
);

-- Audit log for compliance and security
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id) WHERE oauth_provider IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_tenant_role ON users(tenant_id, role);

CREATE INDEX IF NOT EXISTS idx_categories_tenant_active ON raffle_categories(tenant_id, is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_categories_key ON raffle_categories(tenant_id, category_key);

CREATE INDEX IF NOT EXISTS idx_bets_tenant_category ON bets(tenant_id, category_id);
CREATE INDEX IF NOT EXISTS idx_bets_validation ON bets(tenant_id, is_validated);
CREATE INDEX IF NOT EXISTS idx_bets_created ON bets(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bets_email ON bets(tenant_id, user_email);

CREATE INDEX IF NOT EXISTS idx_audit_tenant_created ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- Row-Level Security (RLS) Policies
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant isolation

-- Super admin can see all tenants
CREATE POLICY tenant_isolation_super_admin ON tenants
    FOR ALL 
    TO postgres 
    USING (true);

-- Regular access: tenant can only see themselves
CREATE POLICY tenant_isolation_self ON tenants
    FOR ALL 
    USING (id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, '00000000-0000-0000-0000-000000000000'));

-- Users can only see users in their tenant
CREATE POLICY tenant_isolation_users ON users 
    FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, '00000000-0000-0000-0000-000000000000'));

-- Categories are tenant-isolated
CREATE POLICY tenant_isolation_categories ON raffle_categories 
    FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, '00000000-0000-0000-0000-000000000000'));

-- Bets are tenant-isolated  
CREATE POLICY tenant_isolation_bets ON bets 
    FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, '00000000-0000-0000-0000-000000000000'));

-- OAuth sessions are tenant-isolated
CREATE POLICY tenant_isolation_oauth ON oauth_sessions 
    FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, '00000000-0000-0000-0000-000000000000'));

-- Audit logs are tenant-isolated
CREATE POLICY tenant_isolation_audit ON audit_logs 
    FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, '00000000-0000-0000-0000-000000000000') 
           OR current_user = 'postgres'); -- Super admin can see all

-- Materialized view for tenant statistics (performance optimization)
CREATE MATERIALIZED VIEW IF NOT EXISTS tenant_stats AS
SELECT 
    t.id as tenant_id,
    t.subdomain,
    t.name,
    t.status,
    COUNT(DISTINCT b.id) as total_bets,
    COUNT(DISTINCT b.id) FILTER (WHERE b.is_validated = true) as validated_bets,
    COALESCE(SUM(b.amount), 0) as total_amount,
    COALESCE(SUM(b.amount) FILTER (WHERE b.is_validated = true), 0) as validated_amount,
    COUNT(DISTINCT b.user_email) as unique_users,
    COUNT(DISTINCT rc.id) as active_categories
FROM tenants t
LEFT JOIN bets b ON t.id = b.tenant_id
LEFT JOIN raffle_categories rc ON t.id = rc.tenant_id AND rc.is_active = true
GROUP BY t.id, t.subdomain, t.name, t.status;

-- Unique index for materialized view refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_stats_tenant_id ON tenant_stats(tenant_id);

-- Category statistics view
CREATE MATERIALIZED VIEW IF NOT EXISTS category_stats AS
SELECT 
    rc.id as category_id,
    rc.tenant_id,
    rc.category_key,
    rc.category_name,
    COUNT(b.id) as bet_count,
    COUNT(b.id) FILTER (WHERE b.is_validated = true) as validated_count,
    COALESCE(SUM(b.amount), 0) as total_amount,
    COALESCE(SUM(b.amount) FILTER (WHERE b.is_validated = true), 0) as validated_amount
FROM raffle_categories rc
LEFT JOIN bets b ON rc.id = b.category_id
WHERE rc.is_active = true
GROUP BY rc.id, rc.tenant_id, rc.category_key, rc.category_name;

-- Unique index for category stats
CREATE UNIQUE INDEX IF NOT EXISTS idx_category_stats_category_id ON category_stats(category_id);

-- Functions for materialized view refresh
CREATE OR REPLACE FUNCTION refresh_tenant_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh stats in background
    PERFORM pg_notify('refresh_stats', 'tenant_stats');
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_category_stats()  
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh category stats in background
    PERFORM pg_notify('refresh_stats', 'category_stats');
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic stats refresh
CREATE TRIGGER refresh_tenant_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON bets
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_tenant_stats();

CREATE TRIGGER refresh_category_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON bets
    FOR EACH STATEMENT  
    EXECUTE FUNCTION refresh_category_stats();

-- Trigger for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at 
    BEFORE UPDATE ON tenants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON raffle_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to set tenant context (for application use)
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', tenant_uuid::TEXT, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tenant by subdomain (bypasses RLS for initial lookup)
CREATE OR REPLACE FUNCTION get_tenant_by_subdomain(subdomain_param TEXT)
RETURNS TABLE(
    id UUID,
    subdomain TEXT,
    name TEXT,
    owner_email TEXT,
    status TEXT,
    subscription_plan TEXT,
    settings JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY 
    SELECT t.id, t.subdomain, t.name, t.owner_email, t.status, 
           t.subscription_plan, t.settings, t.created_at
    FROM tenants t
    WHERE t.subdomain = subdomain_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create new tenant with default categories
CREATE OR REPLACE FUNCTION create_tenant_with_defaults(
    p_subdomain TEXT,
    p_name TEXT,
    p_owner_email TEXT,
    p_owner_name TEXT,
    p_oauth_provider TEXT DEFAULT NULL,
    p_oauth_id TEXT DEFAULT NULL
) RETURNS TABLE(
    tenant_id UUID,
    user_id UUID
) AS $$
DECLARE
    new_tenant_id UUID;
    new_user_id UUID;
    category_data JSONB;
BEGIN
    -- Create tenant
    INSERT INTO tenants (subdomain, name, owner_email, status)
    VALUES (p_subdomain, p_name, p_owner_email, 'trial')
    RETURNING id INTO new_tenant_id;
    
    -- Create owner user  
    INSERT INTO users (tenant_id, email, full_name, role, oauth_provider, oauth_id)
    VALUES (new_tenant_id, p_owner_email, p_owner_name, 'owner', p_oauth_provider, p_oauth_id)
    RETURNING id INTO new_user_id;
    
    -- Set tenant context for creating default categories
    PERFORM set_config('app.current_tenant_id', new_tenant_id::TEXT, true);
    
    -- Create default categories
    FOR category_data IN 
        SELECT * FROM jsonb_array_elements('[
            {
                "category_key": "birth_date",
                "category_name": "Birth Date", 
                "description": "What date will the baby arrive?",
                "bet_price": 5.00,
                "options": ["January 15", "January 16", "January 17", "January 18", "January 19", "January 20", "Other date"],
                "display_order": 1
            },
            {
                "category_key": "birth_time",
                "category_name": "Birth Time",
                "description": "What time will the baby arrive?", 
                "bet_price": 5.00,
                "options": ["12:00 AM - 3:00 AM", "3:00 AM - 6:00 AM", "6:00 AM - 9:00 AM", "9:00 AM - 12:00 PM", "12:00 PM - 3:00 PM", "3:00 PM - 6:00 PM", "6:00 PM - 9:00 PM", "9:00 PM - 12:00 AM"],
                "display_order": 2
            },
            {
                "category_key": "birth_weight", 
                "category_name": "Birth Weight",
                "description": "How much will the baby weigh?",
                "bet_price": 5.00,
                "options": ["Under 6 lbs", "6-7 lbs", "7-8 lbs", "8-9 lbs", "Over 9 lbs"],
                "display_order": 3
            },
            {
                "category_key": "head_circumference",
                "category_name": "Head Circumference", 
                "description": "What will be the baby''s head circumference?",
                "bet_price": 5.00,
                "options": ["Under 13 inches", "13-14 inches", "14-15 inches", "Over 15 inches"],
                "display_order": 4
            },
            {
                "category_key": "birth_length",
                "category_name": "Birth Length",
                "description": "How long will the baby be?",
                "bet_price": 5.00, 
                "options": ["Under 18 inches", "18-19 inches", "19-20 inches", "20-21 inches", "Over 21 inches"],
                "display_order": 5
            },
            {
                "category_key": "doctor_initial",
                "category_name": "Doctor''s Last Initial",
                "description": "What will be the delivering doctor''s last initial?",
                "bet_price": 5.00,
                "options": ["A-E", "F-J", "K-O", "P-T", "U-Z"],
                "display_order": 6
            }
        ]'::jsonb)
    LOOP
        INSERT INTO raffle_categories (
            tenant_id, category_key, category_name, description, 
            bet_price, options, display_order
        )
        VALUES (
            new_tenant_id,
            (category_data->>'category_key')::TEXT,
            (category_data->>'category_name')::TEXT,
            (category_data->>'description')::TEXT,
            (category_data->>'bet_price')::DECIMAL,
            (category_data->'options')::JSONB,
            (category_data->>'display_order')::INTEGER
        );
    END LOOP;
    
    -- Return both IDs
    RETURN QUERY SELECT new_tenant_id, new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initial refresh of materialized views
REFRESH MATERIALIZED VIEW tenant_stats;
REFRESH MATERIALIZED VIEW category_stats;

-- Grant appropriate permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;