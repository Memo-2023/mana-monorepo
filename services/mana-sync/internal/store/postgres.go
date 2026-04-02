package store

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Store handles all PostgreSQL operations for the sync server.
type Store struct {
	pool *pgxpool.Pool
}

// New creates a new Store with a connection pool.
func New(ctx context.Context, databaseURL string) (*Store, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to create pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &Store{pool: pool}, nil
}

// Close shuts down the connection pool.
func (s *Store) Close() {
	s.pool.Close()
}

// Migrate creates the sync_changes table if it doesn't exist.
func (s *Store) Migrate(ctx context.Context) error {
	query := `
		CREATE TABLE IF NOT EXISTS sync_changes (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			app_id TEXT NOT NULL,
			table_name TEXT NOT NULL,
			record_id TEXT NOT NULL,
			user_id TEXT NOT NULL,
			op TEXT NOT NULL CHECK (op IN ('insert', 'update', 'delete')),
			data JSONB,
			field_timestamps JSONB DEFAULT '{}',
			client_id TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT now()
		);

		CREATE INDEX IF NOT EXISTS idx_sync_changes_user_app
			ON sync_changes (user_id, app_id, created_at);

		CREATE INDEX IF NOT EXISTS idx_sync_changes_table_record
			ON sync_changes (table_name, record_id, created_at);

		CREATE INDEX IF NOT EXISTS idx_sync_changes_since
			ON sync_changes (user_id, app_id, table_name, created_at);
	`

	_, err := s.pool.Exec(ctx, query)
	return err
}

// RecordChange stores a client change in the database.
func (s *Store) RecordChange(ctx context.Context, appID, tableName, recordID, userID, op, clientID string, data map[string]any, fieldTimestamps map[string]string) error {
	dataJSON, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("marshal data: %w", err)
	}

	ftJSON, err := json.Marshal(fieldTimestamps)
	if err != nil {
		return fmt.Errorf("marshal field_timestamps: %w", err)
	}

	query := `
		INSERT INTO sync_changes (app_id, table_name, record_id, user_id, op, data, field_timestamps, client_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	_, err = s.pool.Exec(ctx, query, appID, tableName, recordID, userID, op, dataJSON, ftJSON, clientID)
	return err
}

// GetChangesSince returns changes for a user+app+table since a given timestamp,
// excluding changes from the requesting client (to avoid echo).
// The limit parameter controls maximum rows returned (caller should pass limit+1 to detect hasMore).
func (s *Store) GetChangesSince(ctx context.Context, userID, appID, tableName, since, excludeClientID string, limit int) ([]ChangeRow, error) {
	sinceTime, err := time.Parse(time.RFC3339Nano, since)
	if err != nil {
		sinceTime = time.Unix(0, 0)
	}

	query := `
		SELECT id, table_name, record_id, op, data, field_timestamps, client_id, created_at
		FROM sync_changes
		WHERE user_id = $1 AND app_id = $2 AND table_name = $3
			AND created_at > $4 AND client_id != $5
		ORDER BY created_at ASC
		LIMIT $6
	`

	rows, err := s.pool.Query(ctx, query, userID, appID, tableName, sinceTime, excludeClientID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var changes []ChangeRow
	for rows.Next() {
		var c ChangeRow
		var dataJSON, ftJSON []byte

		err := rows.Scan(&c.ID, &c.TableName, &c.RecordID, &c.Op, &dataJSON, &ftJSON, &c.ClientID, &c.CreatedAt)
		if err != nil {
			return nil, err
		}

		if dataJSON != nil {
			if err := json.Unmarshal(dataJSON, &c.Data); err != nil {
				return nil, fmt.Errorf("unmarshal data for record %s: %w", c.RecordID, err)
			}
		}
		if ftJSON != nil {
			if err := json.Unmarshal(ftJSON, &c.FieldTimestamps); err != nil {
				return nil, fmt.Errorf("unmarshal field_timestamps for record %s: %w", c.RecordID, err)
			}
		}

		changes = append(changes, c)
	}

	return changes, rows.Err()
}

// GetAllChangesSince returns changes across all tables for a user+app.
func (s *Store) GetAllChangesSince(ctx context.Context, userID, appID, since, excludeClientID string) ([]ChangeRow, error) {
	sinceTime, err := time.Parse(time.RFC3339Nano, since)
	if err != nil {
		sinceTime = time.Unix(0, 0)
	}

	query := `
		SELECT id, table_name, record_id, op, data, field_timestamps, client_id, created_at
		FROM sync_changes
		WHERE user_id = $1 AND app_id = $2
			AND created_at > $3 AND client_id != $4
		ORDER BY created_at ASC
		LIMIT 5000
	`

	rows, err := s.pool.Query(ctx, query, userID, appID, sinceTime, excludeClientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var changes []ChangeRow
	for rows.Next() {
		var c ChangeRow
		var dataJSON, ftJSON []byte

		err := rows.Scan(&c.ID, &c.TableName, &c.RecordID, &c.Op, &dataJSON, &ftJSON, &c.ClientID, &c.CreatedAt)
		if err != nil {
			return nil, err
		}

		if dataJSON != nil {
			if err := json.Unmarshal(dataJSON, &c.Data); err != nil {
				return nil, fmt.Errorf("unmarshal data for record %s: %w", c.RecordID, err)
			}
		}
		if ftJSON != nil {
			if err := json.Unmarshal(ftJSON, &c.FieldTimestamps); err != nil {
				return nil, fmt.Errorf("unmarshal field_timestamps for record %s: %w", c.RecordID, err)
			}
		}

		changes = append(changes, c)
	}

	return changes, rows.Err()
}

// ChangeRow is a row from the sync_changes table.
type ChangeRow struct {
	ID              string
	TableName       string
	RecordID        string
	Op              string
	Data            map[string]any
	FieldTimestamps map[string]string
	ClientID        string
	CreatedAt       time.Time
}
