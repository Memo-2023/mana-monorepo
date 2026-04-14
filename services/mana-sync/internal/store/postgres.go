package store

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
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

// Migrate creates the sync_changes table and enables row-level security.
//
// Defense-in-depth: every query also passes WHERE user_id = $1, but RLS makes
// it impossible for a future query (or a query injection) to read or write
// across user boundaries. The policy reads `app.current_user_id` from the
// session config — store callers wrap their work in withUser() which sets it.
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
			created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
			-- M2: schema_version lets us evolve the Change wire shape over time.
			-- Default 1 covers rows written before the column existed so the
			-- backup/restore pipeline can always feed them through a migration
			-- chain keyed on this value.
			schema_version INT NOT NULL DEFAULT 1,
			-- AI Workbench: opaque actor JSON (user / ai / system). Null for
			-- pre-actor clients; the webapp stamps every change with it from
			-- the Dexie hook onward. Server-side we just persist and re-emit.
			actor JSONB
		);

		-- Idempotent add for databases created before M2 shipped.
		ALTER TABLE sync_changes
			ADD COLUMN IF NOT EXISTS schema_version INT NOT NULL DEFAULT 1;

		-- Idempotent add for databases created before the AI Workbench.
		ALTER TABLE sync_changes
			ADD COLUMN IF NOT EXISTS actor JSONB;

		CREATE INDEX IF NOT EXISTS idx_sync_changes_user_app
			ON sync_changes (user_id, app_id, created_at);

		CREATE INDEX IF NOT EXISTS idx_sync_changes_table_record
			ON sync_changes (table_name, record_id, created_at);

		CREATE INDEX IF NOT EXISTS idx_sync_changes_since
			ON sync_changes (user_id, app_id, table_name, created_at);

		ALTER TABLE sync_changes ENABLE ROW LEVEL SECURITY;
		-- FORCE makes RLS apply even to the table owner so that the application
		-- role used by mana-sync cannot bypass policies, regardless of grants.
		ALTER TABLE sync_changes FORCE ROW LEVEL SECURITY;

		DROP POLICY IF EXISTS sync_changes_user_isolation ON sync_changes;
		CREATE POLICY sync_changes_user_isolation ON sync_changes
			USING (user_id = current_setting('app.current_user_id', true))
			WITH CHECK (user_id = current_setting('app.current_user_id', true));
	`

	_, err := s.pool.Exec(ctx, query)
	return err
}

// withUser runs fn inside a transaction scoped to the given user_id.
// All RLS-protected reads and writes performed via the supplied tx will be
// confined to rows owned by userID. The session-local app.current_user_id
// setting is reset automatically when the transaction ends.
//
// Empty userIDs are rejected up-front so an unauthenticated request can never
// reach the database with an empty RLS scope (which would match every row).
func (s *Store) withUser(ctx context.Context, userID string, fn func(pgx.Tx) error) error {
	if userID == "" {
		return fmt.Errorf("withUser: empty userID")
	}

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	// set_config(name, value, is_local=true) is the parameterized form of
	// SET LOCAL — SET LOCAL itself does not accept bind parameters.
	if _, err := tx.Exec(ctx, "SELECT set_config('app.current_user_id', $1, true)", userID); err != nil {
		return fmt.Errorf("set rls user: %w", err)
	}

	if err := fn(tx); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// RecordChange stores a client change in the database. The insert is performed
// inside an RLS-scoped transaction so the user_id column is double-checked
// against the policy on the way in — a mismatched user_id would fail WITH CHECK.
//
// `actor` is the opaque JSON blob the webapp stamps on every change (see
// `data/events/actor.ts`). Pass nil for pre-actor callers; the column is
// nullable and cross-device consumers treat a missing actor as `user`.
func (s *Store) RecordChange(ctx context.Context, appID, tableName, recordID, userID, op, clientID string, data map[string]any, fieldTimestamps map[string]string, schemaVersion int, actor json.RawMessage) error {
	if schemaVersion <= 0 {
		schemaVersion = 1
	}

	dataJSON, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("marshal data: %w", err)
	}

	ftJSON, err := json.Marshal(fieldTimestamps)
	if err != nil {
		return fmt.Errorf("marshal field_timestamps: %w", err)
	}

	// pgx serializes a nil []byte as NULL for JSONB columns, which is what
	// we want for pre-actor clients. Non-empty raw JSON is passed through
	// unchanged — we don't validate the shape, that's the webapp's contract.
	var actorJSON []byte
	if len(actor) > 0 {
		actorJSON = []byte(actor)
	}

	return s.withUser(ctx, userID, func(tx pgx.Tx) error {
		query := `
			INSERT INTO sync_changes (app_id, table_name, record_id, user_id, op, data, field_timestamps, client_id, schema_version, actor)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		`
		_, err := tx.Exec(ctx, query, appID, tableName, recordID, userID, op, dataJSON, ftJSON, clientID, schemaVersion, actorJSON)
		return err
	})
}

// GetChangesSince returns changes for a user+app+table since a given timestamp,
// excluding changes from the requesting client (to avoid echo).
// The limit parameter controls maximum rows returned (caller should pass limit+1 to detect hasMore).
func (s *Store) GetChangesSince(ctx context.Context, userID, appID, tableName, since, excludeClientID string, limit int) ([]ChangeRow, error) {
	sinceTime, err := time.Parse(time.RFC3339Nano, since)
	if err != nil {
		sinceTime = time.Unix(0, 0)
	}

	var changes []ChangeRow
	err = s.withUser(ctx, userID, func(tx pgx.Tx) error {
		query := `
			SELECT id, table_name, record_id, op, data, field_timestamps, client_id, created_at, schema_version, actor
			FROM sync_changes
			WHERE user_id = $1 AND app_id = $2 AND table_name = $3
				AND created_at > $4 AND client_id != $5
			ORDER BY created_at ASC
			LIMIT $6
		`
		rows, err := tx.Query(ctx, query, userID, appID, tableName, sinceTime, excludeClientID, limit)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var c ChangeRow
			var dataJSON, ftJSON, actorJSON []byte

			if err := rows.Scan(&c.ID, &c.TableName, &c.RecordID, &c.Op, &dataJSON, &ftJSON, &c.ClientID, &c.CreatedAt, &c.SchemaVersion, &actorJSON); err != nil {
				return err
			}

			if dataJSON != nil {
				if err := json.Unmarshal(dataJSON, &c.Data); err != nil {
					return fmt.Errorf("unmarshal data for record %s: %w", c.RecordID, err)
				}
			}
			if ftJSON != nil {
				if err := json.Unmarshal(ftJSON, &c.FieldTimestamps); err != nil {
					return fmt.Errorf("unmarshal field_timestamps for record %s: %w", c.RecordID, err)
				}
			}
			if len(actorJSON) > 0 {
				c.Actor = json.RawMessage(actorJSON)
			}

			changes = append(changes, c)
		}
		return rows.Err()
	})
	return changes, err
}

// GetAllChangesSince returns changes across all tables for a user+app.
func (s *Store) GetAllChangesSince(ctx context.Context, userID, appID, since, excludeClientID string) ([]ChangeRow, error) {
	sinceTime, err := time.Parse(time.RFC3339Nano, since)
	if err != nil {
		sinceTime = time.Unix(0, 0)
	}

	var changes []ChangeRow
	err = s.withUser(ctx, userID, func(tx pgx.Tx) error {
		query := `
			SELECT id, table_name, record_id, op, data, field_timestamps, client_id, created_at, schema_version, actor
			FROM sync_changes
			WHERE user_id = $1 AND app_id = $2
				AND created_at > $3 AND client_id != $4
			ORDER BY created_at ASC
			LIMIT 5000
		`
		rows, err := tx.Query(ctx, query, userID, appID, sinceTime, excludeClientID)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var c ChangeRow
			var dataJSON, ftJSON, actorJSON []byte

			if err := rows.Scan(&c.ID, &c.TableName, &c.RecordID, &c.Op, &dataJSON, &ftJSON, &c.ClientID, &c.CreatedAt, &c.SchemaVersion, &actorJSON); err != nil {
				return err
			}

			if dataJSON != nil {
				if err := json.Unmarshal(dataJSON, &c.Data); err != nil {
					return fmt.Errorf("unmarshal data for record %s: %w", c.RecordID, err)
				}
			}
			if ftJSON != nil {
				if err := json.Unmarshal(ftJSON, &c.FieldTimestamps); err != nil {
					return fmt.Errorf("unmarshal field_timestamps for record %s: %w", c.RecordID, err)
				}
			}
			if len(actorJSON) > 0 {
				c.Actor = json.RawMessage(actorJSON)
			}

			changes = append(changes, c)
		}
		return rows.Err()
	})
	return changes, err
}

// StreamAllUserChanges iterates every sync_changes row owned by userID, across
// all apps/tables, in chronological order, invoking fn for each row. Designed
// for the backup/export endpoint — unbounded result set, so rows are streamed
// via a cursor-free single query (pgx streams rows as they arrive from the
// server). If fn returns an error, iteration stops and the error is returned.
func (s *Store) StreamAllUserChanges(ctx context.Context, userID string, fn func(ChangeRow) error) error {
	return s.withUser(ctx, userID, func(tx pgx.Tx) error {
		query := `
			SELECT id, app_id, table_name, record_id, op, data, field_timestamps, client_id, created_at, schema_version, actor
			FROM sync_changes
			WHERE user_id = $1
			ORDER BY created_at ASC, id ASC
		`
		rows, err := tx.Query(ctx, query, userID)
		if err != nil {
			return fmt.Errorf("query: %w", err)
		}
		defer rows.Close()

		for rows.Next() {
			var c ChangeRow
			var dataJSON, ftJSON, actorJSON []byte
			if err := rows.Scan(&c.ID, &c.AppID, &c.TableName, &c.RecordID, &c.Op, &dataJSON, &ftJSON, &c.ClientID, &c.CreatedAt, &c.SchemaVersion, &actorJSON); err != nil {
				return fmt.Errorf("scan: %w", err)
			}
			if dataJSON != nil {
				if err := json.Unmarshal(dataJSON, &c.Data); err != nil {
					return fmt.Errorf("unmarshal data for record %s: %w", c.RecordID, err)
				}
			}
			if ftJSON != nil {
				if err := json.Unmarshal(ftJSON, &c.FieldTimestamps); err != nil {
					return fmt.Errorf("unmarshal field_timestamps for record %s: %w", c.RecordID, err)
				}
			}
			if len(actorJSON) > 0 {
				c.Actor = json.RawMessage(actorJSON)
			}
			if err := fn(c); err != nil {
				return err
			}
		}
		return rows.Err()
	})
}

// ChangeRow is a row from the sync_changes table.
type ChangeRow struct {
	AppID           string
	ID              string
	TableName       string
	RecordID        string
	Op              string
	Data            map[string]any
	FieldTimestamps map[string]string
	ClientID        string
	CreatedAt       time.Time
	SchemaVersion   int
	// Actor is nil for rows written by pre-actor clients. Consumers on
	// other devices render a missing actor as "user".
	Actor json.RawMessage
}
