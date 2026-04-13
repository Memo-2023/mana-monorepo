#!/bin/bash
# Create schemas within mana_platform database
# Docker entrypoint runs .sh files after .sql files

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname mana_platform <<-EOSQL
    -- Core service schemas
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE SCHEMA IF NOT EXISTS credits;
    CREATE SCHEMA IF NOT EXISTS gifts;
    CREATE SCHEMA IF NOT EXISTS subscriptions;
    CREATE SCHEMA IF NOT EXISTS feedback;
    CREATE SCHEMA IF NOT EXISTS usr;
    CREATE SCHEMA IF NOT EXISTS media;

    -- App server-side schemas
    CREATE SCHEMA IF NOT EXISTS todo;
    CREATE SCHEMA IF NOT EXISTS traces;
    CREATE SCHEMA IF NOT EXISTS presi;
    CREATE SCHEMA IF NOT EXISTS uload;
    CREATE SCHEMA IF NOT EXISTS cards;
    CREATE SCHEMA IF NOT EXISTS mail;

    -- Grant schema usage
    GRANT ALL ON SCHEMA auth, credits, gifts, subscriptions, feedback, usr, media,
        todo, traces, presi, uload, cards, mail TO mana;
EOSQL
