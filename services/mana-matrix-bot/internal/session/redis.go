package session

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisStore is a Redis-backed session manager.
// Sessions are shared across all plugins and persist across restarts.
type RedisStore struct {
	client *redis.Client
	prefix string
	ttl    time.Duration
}

// RedisConfig holds configuration for the Redis session store.
type RedisConfig struct {
	Host     string
	Port     int
	Password string
	Prefix   string        // key prefix (default: "mana-bot:session:")
	TTL      time.Duration // session TTL (default: 24h)
}

// NewRedisStore creates a new Redis session store.
func NewRedisStore(cfg RedisConfig) (*RedisStore, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Password: cfg.Password,
		DB:       0,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis ping: %w", err)
	}

	prefix := cfg.Prefix
	if prefix == "" {
		prefix = "mana-bot:session:"
	}

	ttl := cfg.TTL
	if ttl == 0 {
		ttl = 24 * time.Hour
	}

	slog.Info("redis session store connected", "addr", fmt.Sprintf("%s:%d", cfg.Host, cfg.Port))

	return &RedisStore{
		client: client,
		prefix: prefix,
		ttl:    ttl,
	}, nil
}

// key builds the Redis key for a user's session data.
func (s *RedisStore) key(userID string) string {
	return s.prefix + userID
}

// tokenKey builds the Redis key for a user's auth token.
func (s *RedisStore) tokenKey(userID string) string {
	return s.prefix + "token:" + userID
}

// Get retrieves a session value.
func (s *RedisStore) Get(userID, key string) (any, bool) {
	ctx := context.Background()
	val, err := s.client.HGet(ctx, s.key(userID), key).Result()
	if err != nil {
		return nil, false
	}

	// Try to unmarshal as JSON first
	var result any
	if err := json.Unmarshal([]byte(val), &result); err == nil {
		return result, true
	}
	return val, true
}

// Set stores a session value.
func (s *RedisStore) Set(userID, key string, value any) {
	ctx := context.Background()
	data, err := json.Marshal(value)
	if err != nil {
		slog.Error("redis session set: marshal failed", "error", err)
		return
	}

	pipe := s.client.Pipeline()
	pipe.HSet(ctx, s.key(userID), key, string(data))
	pipe.Expire(ctx, s.key(userID), s.ttl)
	if _, err := pipe.Exec(ctx); err != nil {
		slog.Error("redis session set failed", "error", err)
	}
}

// Delete removes a session value.
func (s *RedisStore) Delete(userID, key string) {
	ctx := context.Background()
	if err := s.client.HDel(ctx, s.key(userID), key).Err(); err != nil {
		slog.Error("redis session delete failed", "error", err)
	}
}

// GetToken returns the stored auth token for a user.
func (s *RedisStore) GetToken(userID string) (string, bool) {
	ctx := context.Background()

	// Get token and expiry from hash
	vals, err := s.client.HMGet(ctx, s.tokenKey(userID), "token", "expires_at").Result()
	if err != nil || len(vals) < 2 || vals[0] == nil {
		return "", false
	}

	token, ok := vals[0].(string)
	if !ok || token == "" {
		return "", false
	}

	// Check expiry
	if expiresStr, ok := vals[1].(string); ok && expiresStr != "" {
		expiresAt, err := time.Parse(time.RFC3339, expiresStr)
		if err == nil && time.Now().After(expiresAt) {
			// Token expired, clean up
			s.client.Del(ctx, s.tokenKey(userID))
			return "", false
		}
	}

	return token, true
}

// SetToken stores an auth token with expiration.
func (s *RedisStore) SetToken(userID, token string, expiresAt time.Time) {
	ctx := context.Background()

	pipe := s.client.Pipeline()
	pipe.HSet(ctx, s.tokenKey(userID), map[string]any{
		"token":      token,
		"expires_at": expiresAt.Format(time.RFC3339),
	})

	// Set Redis TTL to match token expiry (plus buffer)
	ttl := time.Until(expiresAt) + 1*time.Hour
	if ttl < s.ttl {
		ttl = s.ttl
	}
	pipe.Expire(ctx, s.tokenKey(userID), ttl)

	if _, err := pipe.Exec(ctx); err != nil {
		slog.Error("redis set token failed", "error", err)
	}
}

// IsLoggedIn checks if a user has a valid token.
func (s *RedisStore) IsLoggedIn(userID string) bool {
	_, ok := s.GetToken(userID)
	return ok
}

// Close closes the Redis connection.
func (s *RedisStore) Close() error {
	return s.client.Close()
}
