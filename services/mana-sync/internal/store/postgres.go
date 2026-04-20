package store

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
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

		-- Idempotent add for databases created before the Spaces foundation.
		-- Nullable so pre-v28 clients (which don't stamp a spaceId) can
		-- keep pushing. The RLS policy is intentionally NOT space-aware
		-- yet — user_id remains the primary guard. Multi-member scoping
		-- for shared spaces will add a second policy in a follow-up.
		-- See docs/plans/spaces-foundation.md.
		ALTER TABLE sync_changes
			ADD COLUMN IF NOT EXISTS space_id TEXT;

		CREATE INDEX IF NOT EXISTS idx_sync_changes_user_app
			ON sync_changes (user_id, app_id, created_at);

		CREATE INDEX IF NOT EXISTS idx_sync_changes_table_record
			ON sync_changes (table_name, record_id, created_at);

		CREATE INDEX IF NOT EXISTS idx_sync_changes_since
			ON sync_changes (user_id, app_id, table_name, created_at);

		-- Fast "all changes for a space since X" queries once shared spaces
		-- go live. Safe to create with nullable space_id — Postgres partial
		-- indexes skip NULLs unless asked otherwise.
		CREATE INDEX IF NOT EXISTS idx_sync_changes_user_space_app_since
			ON sync_changes (user_id, space_id, app_id, created_at)
			WHERE space_id IS NOT NULL;

		ALTER TABLE sync_changes ENABLE ROW LEVEL SECURITY;
		-- FORCE makes RLS apply even to the table owner so that the application
		-- role used by mana-sync cannot bypass policies, regardless of grants.
		ALTER TABLE sync_changes FORCE ROW LEVEL SECURITY;

		DROP POLICY IF EXISTS sync_changes_user_isolation ON sync_changes;
		CREATE POLICY sync_changes_user_isolation ON sync_changes
			USING (user_id = current_setting('app.current_user_id', true))
			WITH CHECK (user_id = current_setting('app.current_user_id', true));

		-- Shared-space read policy: a user can also read rows whose
		-- space_id appears in app.current_user_space_ids (comma-
		-- separated). Populated from the caller's Space memberships at
		-- transaction start via withUser. Today the list is typically
		-- empty (every space has a single member = the author), so this
		-- policy is a no-op and user_id_isolation is the only guard. The
		-- moment shared spaces go live, the caller starts passing real
		-- membership lists and this policy activates without any
		-- further migration.
		--
		-- WITH CHECK is intentionally absent: writes still require the
		-- row's user_id to match the caller (author integrity). Members
		-- read, owner/author writes.
		DROP POLICY IF EXISTS sync_changes_space_member_read ON sync_changes;
		CREATE POLICY sync_changes_space_member_read ON sync_changes
			FOR SELECT
			USING (
				space_id IS NOT NULL
				AND space_id = ANY(
					string_to_array(
						coalesce(current_setting('app.current_user_space_ids', true), ''),
						','
					)
				)
			);
	`

	_, err := s.pool.Exec(ctx, query)
	return err
}

// withUser runs fn inside a transaction scoped to the given user_id.
// All RLS-protected reads and writes performed via the supplied tx will be
// confined to rows owned by userID OR rows whose space_id is in the
// caller's space-membership list. The session-local app.current_user_id
// and app.current_user_space_ids settings are reset automatically when
// the transaction ends.
//
// Empty userIDs are rejected up-front so an unauthenticated request can
// never reach the database with an empty RLS scope (which would match
// every row). Empty memberships are fine — today they're the norm
// because every space has exactly one member (the author).
func (s *Store) withUser(ctx context.Context, userID string, fn func(pgx.Tx) error) error {
	return s.withUserAndMemberships(ctx, userID, nil, fn)
}

// withUserAndMemberships is the explicit form: pass the caller's Space
// membership list so records from shared spaces resolve via the
// sync_changes_space_member_read policy. The comma-separated join is
// safe against injection because pgx parameterizes the value — Postgres
// string_to_array then splits it on commas inside the policy.
func (s *Store) withUserAndMemberships(
	ctx context.Context,
	userID string,
	spaceIDs []string,
	fn func(pgx.Tx) error,
) error {
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
	// Filter out empty strings that would otherwise make the comma list
	// match rows with space_id = '' (which we never produce, but defense
	// in depth is cheap here).
	clean := make([]string, 0, len(spaceIDs))
	for _, id := range spaceIDs {
		if id != "" {
			clean = append(clean, id)
		}
	}
	if _, err := tx.Exec(
		ctx,
		"SELECT set_config('app.current_user_space_ids', $1, true)",
		strings.Join(clean, ","),
	); err != nil {
		return fmt.Errorf("set rls space ids: %w", err)
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
// `spaceID` is the Better Auth organization id the record belongs to.
// Pass empty string for pre-v28 callers; the column is nullable so mixed
// populations of pre- and post-v28 clients are fine. When multi-member
// space RLS lands, empty space_id rows will need a one-off backfill.
//
// `actor` is the opaque JSON blob the webapp stamps on every change (see
// `data/events/actor.ts`). Pass nil for pre-actor callers; the column is
// nullable and cross-device consumers treat a missing actor as `user`.
func (s *Store) RecordChange(ctx context.Context, appID, tableName, recordID, userID, spaceID, op, clientID string, data map[string]any, fieldTimestamps map[string]string, schemaVersion int, actor json.RawMessage) error {
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

	// pgx interprets a Go empty string as empty, not NULL — use *string so
	// an unset space_id lands as a real SQL NULL and the partial index
	// skips the row.
	var spaceIDParam *string
	if spaceID != "" {
		spaceIDParam = &spaceID
	}

	return s.withUser(ctx, userID, func(tx pgx.Tx) error {
		query := `
			INSERT INTO sync_changes (app_id, table_name, record_id, user_id, space_id, op, data, field_timestamps, client_id, schema_version, actor)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		`
		_, err := tx.Exec(ctx, query, appID, tableName, recordID, userID, spaceIDParam, op, dataJSON, ftJSON, clientID, schemaVersion, actorJSON)
		return err
	})
}

// GetChangesSince returns changes for a user+app+table since a given timestamp,
// excluding changes from the requesting client (to avoid echo).
// The limit parameter controls maximum rows returned (caller should pass limit+1 to detect hasMore).
// spaceIDs is the caller's Space membership list — rows whose space_id matches any of these
// are also returned (in addition to rows the caller authored).
func (s *Store) GetChangesSince(ctx context.Context, userID, appID, tableName, since, excludeClientID string, limit int, spaceIDs []string) ([]ChangeRow, error) {
	sinceTime, err := time.Parse(time.RFC3339Nano, since)
	if err != nil {
		sinceTime = time.Unix(0, 0)
	}

	var changes []ChangeRow
	err = s.withUserAndMemberships(ctx, userID, spaceIDs, func(tx pgx.Tx) error {
		query := `
			SELECT id, table_name, record_id, op, data, field_timestamps, client_id, created_at, schema_version, space_id, actor
			FROM sync_changes
			WHERE (user_id = $1 OR space_id = ANY($7)) AND app_id = $2 AND table_name = $3
				AND created_at > $4 AND client_id != $5
			ORDER BY created_at ASC
			LIMIT $6
		`
		rows, err := tx.Query(ctx, query, userID, appID, tableName, sinceTime, excludeClientID, limit, spaceIDs)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var c ChangeRow
			var dataJSON, ftJSON, actorJSON []byte
			var spaceID *string

			if err := rows.Scan(&c.ID, &c.TableName, &c.RecordID, &c.Op, &dataJSON, &ftJSON, &c.ClientID, &c.CreatedAt, &c.SchemaVersion, &spaceID, &actorJSON); err != nil {
				return err
			}

			if spaceID != nil {
				c.SpaceID = *spaceID
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
// spaceIDs is the caller's Space membership list — rows whose space_id matches any of these
// are also returned (in addition to rows the caller authored).
func (s *Store) GetAllChangesSince(ctx context.Context, userID, appID, since, excludeClientID string, spaceIDs []string) ([]ChangeRow, error) {
	sinceTime, err := time.Parse(time.RFC3339Nano, since)
	if err != nil {
		sinceTime = time.Unix(0, 0)
	}

	var changes []ChangeRow
	err = s.withUserAndMemberships(ctx, userID, spaceIDs, func(tx pgx.Tx) error {
		query := `
			SELECT id, table_name, record_id, op, data, field_timestamps, client_id, created_at, schema_version, space_id, actor
			FROM sync_changes
			WHERE (user_id = $1 OR space_id = ANY($5)) AND app_id = $2
				AND created_at > $3 AND client_id != $4
			ORDER BY created_at ASC
			LIMIT 5000
		`
		rows, err := tx.Query(ctx, query, userID, appID, sinceTime, excludeClientID, spaceIDs)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var c ChangeRow
			var dataJSON, ftJSON, actorJSON []byte
			var spaceID *string

			if err := rows.Scan(&c.ID, &c.TableName, &c.RecordID, &c.Op, &dataJSON, &ftJSON, &c.ClientID, &c.CreatedAt, &c.SchemaVersion, &spaceID, &actorJSON); err != nil {
				return err
			}

			if spaceID != nil {
				c.SpaceID = *spaceID
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
			SELECT id, app_id, table_name, record_id, op, data, field_timestamps, client_id, created_at, schema_version, space_id, actor
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
			var spaceID *string
			if err := rows.Scan(&c.ID, &c.AppID, &c.TableName, &c.RecordID, &c.Op, &dataJSON, &ftJSON, &c.ClientID, &c.CreatedAt, &c.SchemaVersion, &spaceID, &actorJSON); err != nil {
				return fmt.Errorf("scan: %w", err)
			}
			if spaceID != nil {
				c.SpaceID = *spaceID
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
	// SpaceID is empty for pre-v28 rows. Consumers use it to partition
	// the reader cache per space; an empty string means "implicit personal"
	// until the bootstrap reconciliation fills it in.
	SpaceID string
	// Actor is nil for rows written by pre-actor clients. Consumers on
	// other devices render a missing actor as "user".
	Actor json.RawMessage
}
