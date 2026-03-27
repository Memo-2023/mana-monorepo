package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ApiKey represents a stored API key.
type ApiKey struct {
	ID               string     `json:"id"`
	Key              string     `json:"key"` // masked in responses
	KeyHash          string     `json:"-"`
	KeyPrefix        string     `json:"keyPrefix"`
	UserID           *string    `json:"userId"`
	OrganizationID   *string    `json:"organizationId"`
	Name             string     `json:"name"`
	Description      string     `json:"description"`
	Tier             string     `json:"tier"`
	RateLimit        int        `json:"rateLimit"`
	MonthlyCredits   int        `json:"monthlyCredits"`
	CreditsUsed      int        `json:"creditsUsed"`
	CreditsResetAt   *time.Time `json:"creditsResetAt"`
	AllowedEndpoints string     `json:"allowedEndpoints"` // JSON array
	AllowedIPs       *string    `json:"allowedIps"`
	Active           bool       `json:"active"`
	ExpiresAt        *time.Time `json:"expiresAt"`
	LastUsedAt       *time.Time `json:"lastUsedAt"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

// ApiKeyData is the validated key data attached to requests.
type ApiKeyData struct {
	ID               string
	UserID           *string
	OrganizationID   *string
	Name             string
	Tier             string
	RateLimit        int
	MonthlyCredits   int
	CreditsUsed      int
	AllowedEndpoints string
	AllowedIPs       *string
	Active           bool
	ExpiresAt        *time.Time
}

// PricingTier defines limits for a tier.
type PricingTier struct {
	Name           string
	RateLimit      int
	MonthlyCredits int
	Endpoints      []string
	Price          int // cents
}

var Tiers = map[string]PricingTier{
	"free":       {Name: "Free", RateLimit: 10, MonthlyCredits: 100, Endpoints: []string{"search"}, Price: 0},
	"pro":        {Name: "Pro", RateLimit: 100, MonthlyCredits: 5000, Endpoints: []string{"search", "stt", "tts"}, Price: 1900},
	"enterprise": {Name: "Enterprise", RateLimit: 1000, MonthlyCredits: 50000, Endpoints: []string{"search", "stt", "tts"}, Price: 9900},
}

// CreditCosts per endpoint.
var CreditCosts = map[string]int{
	"search":  1,
	"extract": 1,
	"stt":     10, // per minute
	"tts":     1,  // per 1000 chars
}

// ApiKeyService manages API keys in PostgreSQL.
type ApiKeyService struct {
	pool       *pgxpool.Pool
	prefixLive string
	prefixTest string
}

// NewApiKeyService creates a new service.
func NewApiKeyService(pool *pgxpool.Pool, prefixLive, prefixTest string) *ApiKeyService {
	return &ApiKeyService{pool: pool, prefixLive: prefixLive, prefixTest: prefixTest}
}

// GenerateKey creates a new API key string.
func (s *ApiKeyService) GenerateKey(isTest bool) (key, hash, prefix string) {
	pfx := s.prefixLive
	if isTest {
		pfx = s.prefixTest
	}

	b := make([]byte, 24)
	rand.Read(b)
	randomPart := base64.RawURLEncoding.EncodeToString(b)
	key = pfx + randomPart

	h := sha256.Sum256([]byte(key))
	hash = fmt.Sprintf("%x", h)
	prefix = pfx
	return
}

// MaskKey hides most of the key for display.
func (s *ApiKeyService) MaskKey(key string) string {
	if len(key) <= 12 {
		return key
	}
	pfx := s.prefixLive
	if len(key) > len(s.prefixTest) && key[:len(s.prefixTest)] == s.prefixTest {
		pfx = s.prefixTest
	}
	return pfx + "..." + key[len(key)-4:]
}

// Create creates a new API key.
func (s *ApiKeyService) Create(ctx context.Context, userID, name, description, tier string, isTest bool) (string, *ApiKey, error) {
	key, hash, prefix := s.GenerateKey(isTest)

	t, ok := Tiers[tier]
	if !ok {
		t = Tiers["free"]
		tier = "free"
	}

	endpoints, _ := json.Marshal(t.Endpoints)
	resetAt := nextMonthReset()

	row := s.pool.QueryRow(ctx, `
		INSERT INTO api_gateway.api_keys (key, key_hash, key_prefix, user_id, name, description, tier, rate_limit, monthly_credits, credits_used, credits_reset_at, allowed_endpoints, active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, $11, true)
		RETURNING id, created_at, updated_at
	`, key, hash, prefix, userID, name, description, tier, t.RateLimit, t.MonthlyCredits, resetAt, string(endpoints))

	var apiKey ApiKey
	var id string
	var createdAt, updatedAt time.Time
	if err := row.Scan(&id, &createdAt, &updatedAt); err != nil {
		return "", nil, fmt.Errorf("create key: %w", err)
	}

	apiKey = ApiKey{
		ID: id, Key: s.MaskKey(key), KeyPrefix: prefix,
		UserID: &userID, Name: name, Description: description,
		Tier: tier, RateLimit: t.RateLimit, MonthlyCredits: t.MonthlyCredits,
		CreditsUsed: 0, CreditsResetAt: &resetAt, AllowedEndpoints: string(endpoints),
		Active: true, CreatedAt: createdAt, UpdatedAt: updatedAt,
	}

	return key, &apiKey, nil
}

// ValidateKey looks up a key by its hash.
func (s *ApiKeyService) ValidateKey(ctx context.Context, rawKey string) (*ApiKeyData, error) {
	h := sha256.Sum256([]byte(rawKey))
	hash := fmt.Sprintf("%x", h)

	var data ApiKeyData
	err := s.pool.QueryRow(ctx, `
		SELECT id, user_id, organization_id, name, tier, rate_limit, monthly_credits, credits_used, allowed_endpoints, allowed_ips, active, expires_at
		FROM api_gateway.api_keys WHERE key_hash = $1
	`, hash).Scan(&data.ID, &data.UserID, &data.OrganizationID, &data.Name, &data.Tier,
		&data.RateLimit, &data.MonthlyCredits, &data.CreditsUsed, &data.AllowedEndpoints,
		&data.AllowedIPs, &data.Active, &data.ExpiresAt)

	if err != nil {
		return nil, err
	}

	// Update last_used_at
	s.pool.Exec(ctx, `UPDATE api_gateway.api_keys SET last_used_at = NOW() WHERE id = $1`, data.ID)

	return &data, nil
}

// ListByUser returns all keys for a user (masked).
func (s *ApiKeyService) ListByUser(ctx context.Context, userID string) ([]ApiKey, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, key, key_prefix, user_id, name, description, tier, rate_limit, monthly_credits, credits_used, credits_reset_at, allowed_endpoints, active, expires_at, last_used_at, created_at, updated_at
		FROM api_gateway.api_keys WHERE user_id = $1 ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var keys []ApiKey
	for rows.Next() {
		var k ApiKey
		if err := rows.Scan(&k.ID, &k.Key, &k.KeyPrefix, &k.UserID, &k.Name, &k.Description,
			&k.Tier, &k.RateLimit, &k.MonthlyCredits, &k.CreditsUsed, &k.CreditsResetAt,
			&k.AllowedEndpoints, &k.Active, &k.ExpiresAt, &k.LastUsedAt, &k.CreatedAt, &k.UpdatedAt); err != nil {
			return nil, err
		}
		k.Key = s.MaskKey(k.Key)
		keys = append(keys, k)
	}
	return keys, nil
}

// Delete removes an API key.
func (s *ApiKeyService) Delete(ctx context.Context, id, userID string) error {
	tag, err := s.pool.Exec(ctx, `DELETE FROM api_gateway.api_keys WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("key not found")
	}
	return nil
}

// IncrementCredits adds used credits to a key.
func (s *ApiKeyService) IncrementCredits(ctx context.Context, keyID string, amount int) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE api_gateway.api_keys
		SET credits_used = CASE
			WHEN credits_reset_at < NOW() THEN $2
			ELSE credits_used + $2
		END,
		credits_reset_at = CASE
			WHEN credits_reset_at < NOW() THEN $3
			ELSE credits_reset_at
		END
		WHERE id = $1
	`, keyID, amount, nextMonthReset())
	return err
}

// HasEnoughCredits checks if a key has sufficient credits.
func (s *ApiKeyService) HasEnoughCredits(ctx context.Context, keyID string, required int) (bool, error) {
	var used, total int
	var resetAt *time.Time
	err := s.pool.QueryRow(ctx, `
		SELECT credits_used, monthly_credits, credits_reset_at FROM api_gateway.api_keys WHERE id = $1
	`, keyID).Scan(&used, &total, &resetAt)
	if err != nil {
		return false, err
	}

	// If past reset date, credits are effectively 0
	if resetAt != nil && time.Now().After(*resetAt) {
		return true, nil
	}

	return used+required <= total, nil
}

func nextMonthReset() time.Time {
	now := time.Now()
	return time.Date(now.Year(), now.Month()+1, 1, 0, 0, 0, 0, time.UTC)
}
