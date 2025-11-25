-- ULoad Database Performance Optimizations
-- Diese SQL-Befehle optimieren die SQLite-Datenbank für bessere Performance

-- 1. Aktiviere WAL-Modus für bessere Concurrency
PRAGMA journal_mode=WAL;

-- 2. Optimiere Cache-Größe (8MB)
PRAGMA cache_size=8000;

-- 3. Synchronisation optimieren für bessere Performance
PRAGMA synchronous=NORMAL;

-- 4. Memory-mapped I/O aktivieren (256MB)
PRAGMA mmap_size=268435456;

-- 5. Auto-Vacuum optimieren
PRAGMA auto_vacuum=INCREMENTAL;

-- 6. Temp Store in Memory
PRAGMA temp_store=MEMORY;

-- 7. Analyze Statistiken aktualisieren
ANALYZE;

-- 8. Erstelle fehlende Indizes für bessere Performance

-- Links Collection Indizes
CREATE INDEX IF NOT EXISTS idx_links_user ON links(user);
CREATE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code);
CREATE INDEX IF NOT EXISTS idx_links_active ON links(active);
CREATE INDEX IF NOT EXISTS idx_links_created ON links(created);
CREATE INDEX IF NOT EXISTS idx_links_user_active ON links(user, active);
CREATE INDEX IF NOT EXISTS idx_links_user_created ON links(user, created DESC);

-- Analytics Collection Indizes  
CREATE INDEX IF NOT EXISTS idx_analytics_link ON analytics(link);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics(created);
CREATE INDEX IF NOT EXISTS idx_analytics_link_created ON analytics(link, created DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_country ON analytics(country);
CREATE INDEX IF NOT EXISTS idx_analytics_device ON analytics(device);

-- Users Collection Indizes (falls vorhanden)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created);

-- Tags Collection Indizes (falls vorhanden)
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_is_public ON tags(is_public);

-- Link Tags Junction Table Indizes
CREATE INDEX IF NOT EXISTS idx_linktags_link_id ON linktags(link_id);
CREATE INDEX IF NOT EXISTS idx_linktags_tag_id ON linktags(tag_id);
CREATE INDEX IF NOT EXISTS idx_linktags_composite ON linktags(link_id, tag_id);

-- Clicks/Analytics Performance Indizes für häufige Queries
CREATE INDEX IF NOT EXISTS idx_analytics_link_country ON analytics(link, country);
CREATE INDEX IF NOT EXISTS idx_analytics_link_device ON analytics(link, device);

-- Composite Index für Dashboard Queries
CREATE INDEX IF NOT EXISTS idx_links_user_active_created ON links(user, active, created DESC);

-- Vacuum und Reindex für sofortige Verbesserung
VACUUM;
REINDEX;

-- Statistiken neu berechnen
ANALYZE;