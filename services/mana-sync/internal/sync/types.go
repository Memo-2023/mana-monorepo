package sync

import "time"

// Change represents a single field-level change to a record.
type Change struct {
	Table     string                  `json:"table"`
	ID        string                  `json:"id"`
	Op        string                  `json:"op"` // "insert", "update", "delete"
	Fields    map[string]*FieldChange `json:"fields,omitempty"`
	Data      map[string]any          `json:"data,omitempty"`
	DeletedAt *string                 `json:"deletedAt,omitempty"`
}

// FieldChange holds a value and the timestamp when it was last changed.
type FieldChange struct {
	Value     any    `json:"value"`
	UpdatedAt string `json:"updatedAt"`
}

// Changeset is a batch of changes sent by a client.
type Changeset struct {
	ClientID string   `json:"clientId"`
	AppID    string   `json:"appId"`
	Since    string   `json:"since"` // ISO timestamp
	Changes  []Change `json:"changes"`
}

// SyncResponse is returned after processing a changeset.
type SyncResponse struct {
	ServerChanges []Change       `json:"serverChanges"`
	Conflicts     []SyncConflict `json:"conflicts"`
	SyncedUntil   string         `json:"syncedUntil"`
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
