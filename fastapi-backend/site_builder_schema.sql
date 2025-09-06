-- Site Builder and Package Management Schema
-- Additional tables for the site builder system

-- Hosting packages table
CREATE TABLE IF NOT EXISTS hosting_packages (
    id TEXT PRIMARY KEY,
    tier TEXT NOT NULL, -- starter, professional, premium, enterprise
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2) NOT NULL,
    stripe_price_id_monthly TEXT NOT NULL,
    stripe_price_id_yearly TEXT NOT NULL,
    features JSON DEFAULT '[]', -- Array of features with included/limit info
    popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Site builder configurations
CREATE TABLE IF NOT EXISTS site_builders (
    id TEXT PRIMARY KEY,
    user_id TEXT, -- NULL for anonymous sessions
    tenant_id TEXT, -- NULL until account creation
    status TEXT DEFAULT 'draft', -- draft, preview, published, archived
    current_step TEXT DEFAULT 'theme', -- theme, content, images, betting_cards, payment_info, review
    completed_steps JSON DEFAULT '[]', -- Array of completed step names
    config JSON NOT NULL DEFAULT '{}', -- Complete site configuration
    preview_url TEXT,
    live_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
);

-- Preview configurations (temporary storage for previews)
CREATE TABLE IF NOT EXISTS preview_configs (
    builder_id TEXT PRIMARY KEY,
    config JSON NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (builder_id) REFERENCES site_builders(id) ON DELETE CASCADE
);

-- Site themes (predefined themes)
CREATE TABLE IF NOT EXISTS site_themes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    theme_type TEXT NOT NULL, -- classic, modern, playful, elegant, minimalist
    description TEXT,
    config JSON NOT NULL DEFAULT '{}', -- Theme configuration (colors, fonts, etc.)
    preview_image_url TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Site analytics (optional - for tracking usage)
CREATE TABLE IF NOT EXISTS site_analytics (
    id TEXT PRIMARY KEY,
    builder_id TEXT NOT NULL,
    tenant_id TEXT,
    event_type TEXT NOT NULL, -- view, bet_placed, etc.
    event_data JSON DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (builder_id) REFERENCES site_builders(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hosting_packages_tier ON hosting_packages(tier);
CREATE INDEX IF NOT EXISTS idx_hosting_packages_active ON hosting_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_hosting_packages_display_order ON hosting_packages(display_order);

CREATE INDEX IF NOT EXISTS idx_site_builders_user_id ON site_builders(user_id);
CREATE INDEX IF NOT EXISTS idx_site_builders_tenant_id ON site_builders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_site_builders_status ON site_builders(status);
CREATE INDEX IF NOT EXISTS idx_site_builders_created_at ON site_builders(created_at);

CREATE INDEX IF NOT EXISTS idx_preview_configs_expires_at ON preview_configs(expires_at);

CREATE INDEX IF NOT EXISTS idx_site_themes_type ON site_themes(theme_type);
CREATE INDEX IF NOT EXISTS idx_site_themes_active ON site_themes(is_active);

CREATE INDEX IF NOT EXISTS idx_site_analytics_builder_id ON site_analytics(builder_id);
CREATE INDEX IF NOT EXISTS idx_site_analytics_tenant_id ON site_analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_site_analytics_created_at ON site_analytics(created_at);

-- Insert default themes
INSERT OR IGNORE INTO site_themes (id, name, theme_type, description, config, preview_image_url, is_premium, display_order) VALUES
('classic', 'Classic Baby Blue', 'classic', 'Traditional baby raffle theme with soft blue tones', 
 '{"colors":{"primary":"#3B82F6","secondary":"#93C5FD","accent":"#F59E0B","background":"#FFFFFF","text":"#1F2937","border":"#E5E7EB"},"typography":{"heading_font":"Georgia","body_font":"Arial","heading_size":"2.5rem","body_size":"1rem","line_height":1.6},"border_radius":"0.25rem","shadow":"0 1px 3px rgba(0,0,0,0.1)"}',
 '/themes/classic-preview.png', FALSE, 1),

('modern', 'Modern Pink', 'modern', 'Contemporary design with vibrant pink accents',
 '{"colors":{"primary":"#EC4899","secondary":"#F9A8D4","accent":"#8B5CF6","background":"#FFFFFF","text":"#111827","border":"#F3F4F6"},"typography":{"heading_font":"Inter","body_font":"Inter","heading_size":"2.25rem","body_size":"0.875rem","line_height":1.7},"border_radius":"0.75rem","shadow":"0 4px 6px rgba(0,0,0,0.05)"}',
 '/themes/modern-preview.png', FALSE, 2),

('playful', 'Playful Rainbow', 'playful', 'Fun and colorful theme perfect for celebrations',
 '{"colors":{"primary":"#F59E0B","secondary":"#FDE68A","accent":"#10B981","background":"#FFFBEB","text":"#92400E","border":"#FED7AA"},"typography":{"heading_font":"Fredoka One","body_font":"Open Sans","heading_size":"2.75rem","body_size":"1rem","line_height":1.6},"border_radius":"1rem","shadow":"0 8px 25px rgba(245,158,11,0.15)"}',
 '/themes/playful-preview.png', TRUE, 3),

('elegant', 'Elegant Purple', 'elegant', 'Sophisticated and elegant design with purple accents',
 '{"colors":{"primary":"#7C3AED","secondary":"#C4B5FD","accent":"#F59E0B","background":"#FAFAFA","text":"#374151","border":"#E5E7EB"},"typography":{"heading_font":"Playfair Display","body_font":"Source Sans Pro","heading_size":"2.5rem","body_size":"1rem","line_height":1.7},"border_radius":"0.5rem","shadow":"0 2px 4px rgba(0,0,0,0.1)"}',
 '/themes/elegant-preview.png', TRUE, 4),

('minimalist', 'Minimalist Gray', 'minimalist', 'Clean and minimal design focusing on content',
 '{"colors":{"primary":"#6B7280","secondary":"#D1D5DB","accent":"#059669","background":"#FFFFFF","text":"#111827","border":"#E5E7EB"},"typography":{"heading_font":"Inter","body_font":"Inter","heading_size":"2rem","body_size":"0.875rem","line_height":1.6},"border_radius":"0.375rem","shadow":"0 1px 2px rgba(0,0,0,0.05)"}',
 '/themes/minimalist-preview.png', FALSE, 5);

-- Cleanup old preview configs (run periodically)
-- DELETE FROM preview_configs WHERE expires_at < datetime('now');