package session

import (
	"sync"
	"time"
)

// UserSession holds per-user session data.
type UserSession struct {
	Token     string
	ExpiresAt time.Time
	Data      map[string]any
}

// MemoryStore is an in-memory session manager.
type MemoryStore struct {
	mu       sync.RWMutex
	sessions map[string]*UserSession // keyed by userID
}

// NewMemoryStore creates a new in-memory session store.
func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		sessions: make(map[string]*UserSession),
	}
}

func (s *MemoryStore) getOrCreate(userID string) *UserSession {
	if sess, ok := s.sessions[userID]; ok {
		return sess
	}
	sess := &UserSession{Data: make(map[string]any)}
	s.sessions[userID] = sess
	return sess
}

// Get retrieves a session value.
func (s *MemoryStore) Get(userID, key string) (any, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	sess, ok := s.sessions[userID]
	if !ok {
		return nil, false
	}
	val, ok := sess.Data[key]
	return val, ok
}

// Set stores a session value.
func (s *MemoryStore) Set(userID, key string, value any) {
	s.mu.Lock()
	defer s.mu.Unlock()
	sess := s.getOrCreate(userID)
	sess.Data[key] = value
}

// Delete removes a session value.
func (s *MemoryStore) Delete(userID, key string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if sess, ok := s.sessions[userID]; ok {
		delete(sess.Data, key)
	}
}

// GetToken returns the stored auth token for a user.
func (s *MemoryStore) GetToken(userID string) (string, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	sess, ok := s.sessions[userID]
	if !ok || sess.Token == "" {
		return "", false
	}
	if time.Now().After(sess.ExpiresAt) {
		return "", false
	}
	return sess.Token, true
}

// SetToken stores an auth token with expiration.
func (s *MemoryStore) SetToken(userID, token string, expiresAt time.Time) {
	s.mu.Lock()
	defer s.mu.Unlock()
	sess := s.getOrCreate(userID)
	sess.Token = token
	sess.ExpiresAt = expiresAt
}

// IsLoggedIn checks if a user has a valid (non-expired) token.
func (s *MemoryStore) IsLoggedIn(userID string) bool {
	_, ok := s.GetToken(userID)
	return ok
}
