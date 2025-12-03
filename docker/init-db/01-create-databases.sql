-- Create databases for all services
-- This script runs on first container initialization

-- Create chat database
CREATE DATABASE chat;

-- Create voxel_lava database
CREATE DATABASE voxel_lava;

-- Create storage database (cloud drive)
CREATE DATABASE storage;

-- Create todo database
CREATE DATABASE todo;

-- Grant all privileges to the default user
GRANT ALL PRIVILEGES ON DATABASE chat TO manacore;
GRANT ALL PRIVILEGES ON DATABASE voxel_lava TO manacore;
GRANT ALL PRIVILEGES ON DATABASE manacore TO manacore;
GRANT ALL PRIVILEGES ON DATABASE storage TO manacore;
GRANT ALL PRIVILEGES ON DATABASE todo TO manacore;
