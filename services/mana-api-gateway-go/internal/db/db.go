package db

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB wraps a pgx connection pool.
type DB struct {
	Pool *pgxpool.Pool
}

// New creates a new database connection pool.
func New(ctx context.Context, databaseURL string) (*DB, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("parse db config: %w", err)
	}

	config.MaxConns = 20
	config.MinConns = 2
	config.MaxConnLifetime = 30 * time.Minute
	config.MaxConnIdleTime = 5 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("ping: %w", err)
	}

	slog.Info("database connected")
	return &DB{Pool: pool}, nil
}

// Migrate creates the schema and tables.
func (d *DB) Migrate(ctx context.Context) error {
	sql := `
	CREATE SCHEMA IF NOT EXISTS api_gateway;

	CREATE TABLE IF NOT EXISTS api_gateway.api_keys (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		key TEXT NOT NULL UNIQUE,
		key_hash TEXT NOT NULL,
		key_prefix TEXT NOT NULL,
		user_id TEXT,
		organization_id TEXT,
		name TEXT NOT NULL,
		description TEXT DEFAULT '',
		tier TEXT NOT NULL DEFAULT 'free',
		rate_limit INT NOT NULL DEFAULT 10,
		monthly_credits INT NOT NULL DEFAULT 100,
		credits_used INT NOT NULL DEFAULT 0,
		credits_reset_at TIMESTAMPTZ,
		allowed_endpoints JSONB DEFAULT '["search"]',
		allowed_ips JSONB,
		active BOOLEAN NOT NULL DEFAULT true,
		expires_at TIMESTAMPTZ,
		last_used_at TIMESTAMPTZ,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_gateway.api_keys(key_hash);
	CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_gateway.api_keys(user_id);

	CREATE TABLE IF NOT EXISTS api_gateway.api_usage (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		api_key_id UUID NOT NULL REFERENCES api_gateway.api_keys(id) ON DELETE CASCADE,
		endpoint TEXT NOT NULL,
		method TEXT NOT NULL,
		path TEXT NOT NULL,
		request_size INT,
		response_size INT,
		latency_ms INT,
		status_code INT,
		credits_used INT NOT NULL DEFAULT 0,
		credit_reason TEXT,
		metadata JSONB,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_api_usage_key_id ON api_gateway.api_usage(api_key_id);
	CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_gateway.api_usage(created_at);

	CREATE TABLE IF NOT EXISTS api_gateway.api_usage_daily (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		api_key_id UUID NOT NULL REFERENCES api_gateway.api_keys(id) ON DELETE CASCADE,
		date DATE NOT NULL,
		endpoint TEXT NOT NULL,
		request_count INT NOT NULL DEFAULT 0,
		credits_used INT NOT NULL DEFAULT 0,
		total_latency_ms INT NOT NULL DEFAULT 0,
		error_count INT NOT NULL DEFAULT 0,
		UNIQUE(api_key_id, date, endpoint)
	);

	CREATE INDEX IF NOT EXISTS idx_api_usage_daily_date ON api_gateway.api_usage_daily(date);
	`

	_, err := d.Pool.Exec(ctx, sql)
	if err != nil {
		return fmt.Errorf("migrate: %w", err)
	}

	slog.Info("database migrated")
	return nil
}

// Close closes the connection pool.
func (d *DB) Close() {
	d.Pool.Close()
}
