-- Create additional databases for services
-- Note: mana_platform is already created as POSTGRES_DB by Docker

-- Sync database: separate for I/O isolation (write-heavy, append-only)
CREATE DATABASE mana_sync;

-- Infrastructure databases (external tools)
CREATE DATABASE glitchtip;
CREATE DATABASE umami;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mana_platform TO manacore;
GRANT ALL PRIVILEGES ON DATABASE mana_sync TO manacore;
GRANT ALL PRIVILEGES ON DATABASE glitchtip TO manacore;
GRANT ALL PRIVILEGES ON DATABASE umami TO manacore;
