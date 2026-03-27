package db

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	Pool *pgxpool.Pool
}

func New(ctx context.Context, databaseURL string) (*DB, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("parse config: %w", err)
	}
	config.MaxConns = 20
	config.MinConns = 2
	config.MaxConnLifetime = 30 * time.Minute

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

func (d *DB) Migrate(ctx context.Context) error {
	sql := `
	CREATE SCHEMA IF NOT EXISTS crawler;

	CREATE TABLE IF NOT EXISTS crawler.crawl_jobs (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		start_url TEXT NOT NULL,
		domain TEXT NOT NULL,
		max_depth INT NOT NULL DEFAULT 3,
		max_pages INT NOT NULL DEFAULT 100,
		rate_limit INT NOT NULL DEFAULT 2,
		include_patterns JSONB,
		exclude_patterns JSONB,
		selectors JSONB,
		output JSONB,
		respect_robots BOOLEAN NOT NULL DEFAULT true,
		status TEXT NOT NULL DEFAULT 'pending',
		progress JSONB DEFAULT '{"discovered":0,"crawled":0,"failed":0,"queued":0}',
		error TEXT,
		user_id TEXT,
		webhook_url TEXT,
		started_at TIMESTAMPTZ,
		completed_at TIMESTAMPTZ,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_crawl_jobs_status ON crawler.crawl_jobs(status);
	CREATE INDEX IF NOT EXISTS idx_crawl_jobs_domain ON crawler.crawl_jobs(domain);

	CREATE TABLE IF NOT EXISTS crawler.crawl_results (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		job_id UUID NOT NULL REFERENCES crawler.crawl_jobs(id) ON DELETE CASCADE,
		url TEXT NOT NULL,
		parent_url TEXT,
		depth INT NOT NULL,
		title TEXT,
		content TEXT,
		markdown TEXT,
		html TEXT,
		metadata JSONB,
		links JSONB,
		status_code INT,
		error TEXT,
		fetch_duration_ms INT,
		parse_duration_ms INT,
		content_length INT,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_crawl_results_job ON crawler.crawl_results(job_id);
	CREATE INDEX IF NOT EXISTS idx_crawl_results_url ON crawler.crawl_results(url);
	`
	_, err := d.Pool.Exec(ctx, sql)
	if err != nil {
		return fmt.Errorf("migrate: %w", err)
	}
	slog.Info("database migrated")
	return nil
}

func (d *DB) Close() { d.Pool.Close() }
