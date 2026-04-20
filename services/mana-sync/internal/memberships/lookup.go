// Package memberships fetches a user's Space membership list from
// mana-auth and caches it in-memory.
//
// The list is passed into every sync transaction's
// `app.current_user_space_ids` session setting so the multi-member RLS
// policy on sync_changes can let co-members of a shared Space read each
// other's records. See docs/plans/spaces-foundation.md.
package memberships

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"sync"
	"time"
)

// Membership is the subset of the /internal/users/:id/memberships
// response shape that we care about — mana-sync doesn't need names or
// metadata, just the set of org IDs and the caller's role in each.
type Membership struct {
	OrganizationID string `json:"organizationId"`
	Role           string `json:"role"`
}

type response struct {
	UserID      string       `json:"userId"`
	Memberships []Membership `json:"memberships"`
}

type cached struct {
	memberships []Membership
	fetchedAt   time.Time
}

// Lookup queries mana-auth for the Space memberships of a user and
// caches the result per-user.
type Lookup struct {
	authURL    string
	serviceKey string
	cacheTTL   time.Duration
	client     *http.Client

	mu    sync.RWMutex
	cache map[string]cached
}

// New creates a Lookup bound to a mana-auth base URL.
func New(authURL, serviceKey string) *Lookup {
	return &Lookup{
		authURL:    authURL,
		serviceKey: serviceKey,
		cacheTTL:   5 * time.Minute,
		client:     &http.Client{Timeout: 5 * time.Second},
		cache:      make(map[string]cached),
	}
}

// For returns the list of organization IDs the user is a member of.
// Fail-open: on any transport error or non-2xx response, returns an
// empty slice. An empty list is safe — the user_id RLS policy still
// gates visibility to the caller's own rows, so the worst case is that
// a shared-space record temporarily looks invisible to a co-member
// until the lookup succeeds on the next request.
func (l *Lookup) For(userID string) []string {
	if userID == "" {
		return nil
	}

	l.mu.RLock()
	entry, ok := l.cache[userID]
	l.mu.RUnlock()
	if ok && time.Since(entry.fetchedAt) < l.cacheTTL {
		return toIDs(entry.memberships)
	}

	memberships := l.fetch(userID)
	if memberships != nil {
		l.mu.Lock()
		l.cache[userID] = cached{memberships: memberships, fetchedAt: time.Now()}
		l.mu.Unlock()
	}
	return toIDs(memberships)
}

// Invalidate drops the cached entry for a user. Called when the user's
// membership set demonstrably changed (invite accepted, member removed
// via HTTP handler). Not strictly required — the cache expires on its
// own — but makes local dogfooding feel responsive.
func (l *Lookup) Invalidate(userID string) {
	l.mu.Lock()
	delete(l.cache, userID)
	l.mu.Unlock()
}

func (l *Lookup) fetch(userID string) []Membership {
	url := fmt.Sprintf("%s/api/v1/internal/users/%s/memberships", l.authURL, userID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		slog.Warn("[memberships] build request failed", "error", err, "userId", userID)
		return nil
	}
	req.Header.Set("x-service-key", l.serviceKey)
	resp, err := l.client.Do(req)
	if err != nil {
		slog.Warn("[memberships] fetch failed", "error", err, "userId", userID)
		return nil
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		slog.Warn("[memberships] non-200", "status", resp.StatusCode, "userId", userID)
		return nil
	}
	var body response
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		slog.Warn("[memberships] decode failed", "error", err, "userId", userID)
		return nil
	}
	return body.Memberships
}

func toIDs(ms []Membership) []string {
	out := make([]string, 0, len(ms))
	for _, m := range ms {
		out = append(out, m.OrganizationID)
	}
	return out
}
