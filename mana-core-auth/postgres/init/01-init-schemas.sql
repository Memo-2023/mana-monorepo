-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS credits;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums
CREATE TYPE auth.user_role AS ENUM ('user', 'admin', 'service');
CREATE TYPE credits.transaction_type AS ENUM ('purchase', 'usage', 'refund', 'bonus', 'expiry', 'adjustment');
CREATE TYPE credits.transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- Grant usage on schemas
GRANT USAGE ON SCHEMA auth TO PUBLIC;
GRANT USAGE ON SCHEMA credits TO PUBLIC;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

COMMENT ON SCHEMA auth IS 'Authentication and user management';
COMMENT ON SCHEMA credits IS 'Credit system and transactions';
