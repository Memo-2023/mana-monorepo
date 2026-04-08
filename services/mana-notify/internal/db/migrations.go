package db

import (
	"context"
	"log/slog"
)

func (d *DB) migrate(ctx context.Context) error {
	slog.Info("running database migrations")

	migrations := []string{
		`CREATE SCHEMA IF NOT EXISTS notify`,

		// Enum types (idempotent with DO blocks)
		`DO $$ BEGIN
			CREATE TYPE notify.channel_type AS ENUM ('email', 'push', 'webhook');
		EXCEPTION WHEN duplicate_object THEN NULL;
		END $$`,

		`DO $$ BEGIN
			CREATE TYPE notify.notification_status AS ENUM ('pending', 'processing', 'delivered', 'failed', 'cancelled');
		EXCEPTION WHEN duplicate_object THEN NULL;
		END $$`,

		`DO $$ BEGIN
			CREATE TYPE notify.priority_type AS ENUM ('low', 'normal', 'high', 'critical');
		EXCEPTION WHEN duplicate_object THEN NULL;
		END $$`,

		// Notifications table
		`CREATE TABLE IF NOT EXISTS notify.notifications (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id TEXT,
			app_id VARCHAR(50) NOT NULL,
			channel notify.channel_type NOT NULL,
			template_id VARCHAR(100),
			subject VARCHAR(500),
			body TEXT,
			data JSONB,
			status notify.notification_status NOT NULL DEFAULT 'pending',
			priority notify.priority_type NOT NULL DEFAULT 'normal',
			scheduled_for TIMESTAMPTZ,
			recipient VARCHAR(500),
			external_id VARCHAR(255),
			attempts INTEGER NOT NULL DEFAULT 0,
			delivered_at TIMESTAMPTZ,
			error_message TEXT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,

		`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notify.notifications (user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_notifications_app_id ON notify.notifications (app_id)`,
		`CREATE INDEX IF NOT EXISTS idx_notifications_status ON notify.notifications (status)`,
		`CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notify.notifications (scheduled_for)`,
		`CREATE INDEX IF NOT EXISTS idx_notifications_external_id ON notify.notifications (external_id)`,

		// Templates table
		`CREATE TABLE IF NOT EXISTS notify.templates (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			slug VARCHAR(100) NOT NULL,
			app_id VARCHAR(50),
			channel notify.channel_type NOT NULL,
			subject VARCHAR(500),
			body_template TEXT NOT NULL,
			locale VARCHAR(10) NOT NULL DEFAULT 'de-DE',
			is_active BOOLEAN NOT NULL DEFAULT true,
			is_system BOOLEAN NOT NULL DEFAULT false,
			variables JSONB,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE(slug, locale)
		)`,

		`CREATE INDEX IF NOT EXISTS idx_templates_app_id ON notify.templates (app_id)`,
		`CREATE INDEX IF NOT EXISTS idx_templates_channel ON notify.templates (channel)`,

		// Devices table
		`CREATE TABLE IF NOT EXISTS notify.devices (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id TEXT NOT NULL,
			push_token TEXT NOT NULL UNIQUE,
			token_type VARCHAR(20) NOT NULL DEFAULT 'expo',
			platform VARCHAR(20),
			device_name VARCHAR(100),
			app_id VARCHAR(50),
			is_active BOOLEAN NOT NULL DEFAULT true,
			last_seen_at TIMESTAMPTZ,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,

		`CREATE INDEX IF NOT EXISTS idx_devices_user_id ON notify.devices (user_id)`,

		// Preferences table
		`CREATE TABLE IF NOT EXISTS notify.preferences (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id TEXT NOT NULL UNIQUE,
			email_enabled BOOLEAN NOT NULL DEFAULT false,
			push_enabled BOOLEAN NOT NULL DEFAULT true,
			quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
			quiet_hours_start VARCHAR(5),
			quiet_hours_end VARCHAR(5),
			timezone VARCHAR(50) NOT NULL DEFAULT 'Europe/Berlin',
			category_preferences JSONB,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,

		// Delivery logs table
		`CREATE TABLE IF NOT EXISTS notify.delivery_logs (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			notification_id UUID NOT NULL REFERENCES notify.notifications(id) ON DELETE CASCADE,
			attempt_number INTEGER NOT NULL,
			channel notify.channel_type NOT NULL,
			success BOOLEAN NOT NULL,
			status_code INTEGER,
			error_message TEXT,
			provider_id VARCHAR(255),
			duration_ms INTEGER,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,

		`CREATE INDEX IF NOT EXISTS idx_delivery_logs_notification_id ON notify.delivery_logs (notification_id)`,
		`CREATE INDEX IF NOT EXISTS idx_delivery_logs_success ON notify.delivery_logs (success)`,
	}

	for _, sql := range migrations {
		if _, err := d.Pool.Exec(ctx, sql); err != nil {
			return err
		}
	}

	slog.Info("migrations completed")
	return nil
}
