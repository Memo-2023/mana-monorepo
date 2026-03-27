package service

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// UsageEntry is a single API usage log entry.
type UsageEntry struct {
	ApiKeyID     string `json:"apiKeyId"`
	Endpoint     string `json:"endpoint"`
	Method       string `json:"method"`
	Path         string `json:"path"`
	RequestSize  int    `json:"requestSize"`
	ResponseSize int    `json:"responseSize"`
	LatencyMs    int    `json:"latencyMs"`
	StatusCode   int    `json:"statusCode"`
	CreditsUsed  int    `json:"creditsUsed"`
	CreditReason string `json:"creditReason"`
}

// DailyUsage is an aggregated daily usage entry.
type DailyUsage struct {
	Date         string `json:"date"`
	Endpoint     string `json:"endpoint"`
	RequestCount int    `json:"requestCount"`
	CreditsUsed  int    `json:"creditsUsed"`
	ErrorCount   int    `json:"errorCount"`
}

// UsageSummary is an overview of usage.
type UsageSummary struct {
	TotalRequests int `json:"totalRequests"`
	TotalCredits  int `json:"totalCredits"`
	TotalErrors   int `json:"totalErrors"`
}

// UsageService logs and queries API usage.
type UsageService struct {
	pool *pgxpool.Pool
}

// NewUsageService creates a new usage service.
func NewUsageService(pool *pgxpool.Pool) *UsageService {
	return &UsageService{pool: pool}
}

// LogUsage records a single API request.
func (s *UsageService) LogUsage(ctx context.Context, entry UsageEntry) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO api_gateway.api_usage (api_key_id, endpoint, method, path, request_size, response_size, latency_ms, status_code, credits_used, credit_reason)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, entry.ApiKeyID, entry.Endpoint, entry.Method, entry.Path,
		entry.RequestSize, entry.ResponseSize, entry.LatencyMs, entry.StatusCode,
		entry.CreditsUsed, entry.CreditReason)

	// Also upsert daily aggregation
	isError := 0
	if entry.StatusCode >= 400 {
		isError = 1
	}
	s.pool.Exec(ctx, `
		INSERT INTO api_gateway.api_usage_daily (api_key_id, date, endpoint, request_count, credits_used, total_latency_ms, error_count)
		VALUES ($1, CURRENT_DATE, $2, 1, $3, $4, $5)
		ON CONFLICT (api_key_id, date, endpoint)
		DO UPDATE SET
			request_count = api_gateway.api_usage_daily.request_count + 1,
			credits_used = api_gateway.api_usage_daily.credits_used + $3,
			total_latency_ms = api_gateway.api_usage_daily.total_latency_ms + $4,
			error_count = api_gateway.api_usage_daily.error_count + $5
	`, entry.ApiKeyID, entry.Endpoint, entry.CreditsUsed, entry.LatencyMs, isError)

	return err
}

// GetDailyUsage returns daily aggregated usage for a key.
func (s *UsageService) GetDailyUsage(ctx context.Context, keyID string, days int) ([]DailyUsage, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT date::text, endpoint, request_count, credits_used, error_count
		FROM api_gateway.api_usage_daily
		WHERE api_key_id = $1 AND date >= CURRENT_DATE - $2::int
		ORDER BY date DESC
	`, keyID, days)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var usage []DailyUsage
	for rows.Next() {
		var u DailyUsage
		if err := rows.Scan(&u.Date, &u.Endpoint, &u.RequestCount, &u.CreditsUsed, &u.ErrorCount); err != nil {
			return nil, err
		}
		usage = append(usage, u)
	}
	return usage, nil
}

// GetSummary returns a usage summary for a key over a period.
func (s *UsageService) GetSummary(ctx context.Context, keyID string, since time.Time) (*UsageSummary, error) {
	var summary UsageSummary
	err := s.pool.QueryRow(ctx, `
		SELECT COALESCE(SUM(request_count), 0), COALESCE(SUM(credits_used), 0), COALESCE(SUM(error_count), 0)
		FROM api_gateway.api_usage_daily
		WHERE api_key_id = $1 AND date >= $2
	`, keyID, since).Scan(&summary.TotalRequests, &summary.TotalCredits, &summary.TotalErrors)
	if err != nil {
		return nil, err
	}
	return &summary, nil
}
