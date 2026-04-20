package sync

import (
	"encoding/json"
	"time"
)

// CurrentSchemaVersion is the protocol version that this build emits for every
// new change. Bump only with a matching migration registered on both the Go
// server and the TS client so older events can be replayed forward during
// import and live sync.
const CurrentSchemaVersion = 1

// MaxSupportedSchemaVersion is the highest schemaVersion the server will accept
// from a client today. A client running ahead of the server is refused with
// 400; the reverse case (server ahead) replays old events through the migration
// chain on the receiving side.
const MaxSupportedSchemaVersion = 1

// Change represents a single field-level change to a record.
//
// EventID and SchemaVersion are populated on server->client payloads so
// clients can dedup on replay (import flow) and route events through the
// migration chain. Client->server pushes leave EventID empty — the server
// assigns a UUID on insert.
type Change struct {
	EventID       string                  `json:"eventId,omitempty"`
	SchemaVersion int                     `json:"schemaVersion,omitempty"`
	Table         string                  `json:"table"`
	ID            string                  `json:"id"`
	Op            string                  `json:"op"` // "insert", "update", "delete"
	Fields        map[string]*FieldChange `json:"fields,omitempty"`
	Data          map[string]any          `json:"data,omitempty"`
	DeletedAt     *string                 `json:"deletedAt,omitempty"`
	// SpaceID is the Better Auth organization id the record belongs to.
	// Stamped client-side by the Dexie v28 hook from the user's active
	// space (or the `_personal:<userId>` sentinel during the bootstrap
	// window). Stored server-side in the space_id column so future
	// queries can partition by space. Pre-v28 clients omit it; the
	// column is nullable. See docs/plans/spaces-foundation.md.
	SpaceID string `json:"spaceId,omitempty"`
	// Actor is the opaque JSON object the webapp stamps on every pending
	// change (see `data/events/actor.ts`): one of `{ kind: 'user' }`,
	// `{ kind: 'ai', missionId, iterationId, rationale }`, or
	// `{ kind: 'system', source }`. Stored as-is server-side — the server
	// doesn't parse the shape, it just persists + re-emits to other
	// clients so cross-device attribution works. Pre-actor clients omit
	// the field; the column is nullable.
	Actor json.RawMessage `json:"actor,omitempty"`
}

// FieldChange holds a value and the timestamp when it was last changed.
type FieldChange struct {
	Value     any    `json:"value"`
	UpdatedAt string `json:"updatedAt"`
}

// Changeset is a batch of changes sent by a client.
//
// SchemaVersion is the protocol version the client is emitting. Missing/zero
// is treated as 1 for compatibility with pre-M2 clients; anything above
// MaxSupportedSchemaVersion is refused.
type Changeset struct {
	ClientID      string   `json:"clientId"`
	AppID         string   `json:"appId"`
	Since         string   `json:"since"` // ISO timestamp
	Changes       []Change `json:"changes"`
	SchemaVersion int      `json:"schemaVersion,omitempty"`
}

// SyncResponse is returned after processing a changeset.
type SyncResponse struct {
	ServerChanges []Change       `json:"serverChanges"`
	Conflicts     []SyncConflict `json:"conflicts"`
	SyncedUntil   string         `json:"syncedUntil"`
	HasMore       bool           `json:"hasMore,omitempty"`
}

// SyncConflict describes a conflict that couldn't be auto-resolved.
type SyncConflict struct {
	Table           string `json:"table"`
	ID              string `json:"id"`
	Field           string `json:"field"`
	ClientValue     any    `json:"clientValue"`
	ClientTimestamp string `json:"clientTimestamp"`
	ServerValue     any    `json:"serverValue"`
	ServerTimestamp string `json:"serverTimestamp"`
}

// PullRequest represents a pull query from a client.
type PullRequest struct {
	Collection string `json:"collection"`
	Since      string `json:"since"`
}

// SyncRecord is a row in the sync_changes table.
type SyncRecord struct {
	ID              string         `json:"id"`
	AppID           string         `json:"appId"`
	TableName       string         `json:"tableName"`
	RecordID        string         `json:"recordId"`
	UserID          string         `json:"userId"`
	Op              string         `json:"op"`
	Fields          map[string]any `json:"fields,omitempty"`
	Data            map[string]any `json:"data,omitempty"`
	FieldTimestamps map[string]string `json:"fieldTimestamps,omitempty"`
	ClientID        string         `json:"clientId"`
	CreatedAt       time.Time      `json:"createdAt"`
}
