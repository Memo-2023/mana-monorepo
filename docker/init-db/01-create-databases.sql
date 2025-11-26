-- Create databases for all services
-- This script runs on first container initialization

-- Create chat database
CREATE DATABASE chat;

-- Grant all privileges to the default user
GRANT ALL PRIVILEGES ON DATABASE chat TO manacore;
GRANT ALL PRIVILEGES ON DATABASE manacore TO manacore;
