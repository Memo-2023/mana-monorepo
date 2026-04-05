package middleware

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/mana/mana-api-gateway/internal/service"
	"github.com/redis/go-redis/v9"
)

// RateLimitMiddleware enforces per-key sliding window rate limits using Redis.
func RateLimitMiddleware(rdb *redis.Client, prefix string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			keyData := GetApiKey(r)
			if keyData == nil {
				next.ServeHTTP(w, r)
				return
			}

			ctx := r.Context()
			key := prefix + "ratelimit:" + keyData.ID
			limit := keyData.RateLimit
			window := int64(60) // 60 seconds

			now := time.Now().UnixMilli()
			windowStart := now - window*1000

			pipe := rdb.Pipeline()
			pipe.ZRemRangeByScore(ctx, key, "0", strconv.FormatInt(windowStart, 10))
			countCmd := pipe.ZCard(ctx, key)
			pipe.Exec(ctx)

			count := countCmd.Val()

			if count >= int64(limit) {
				w.Header().Set("X-RateLimit-Limit", strconv.Itoa(limit))
				w.Header().Set("X-RateLimit-Remaining", "0")
				w.Header().Set("Retry-After", "60")
				writeJSON(w, http.StatusTooManyRequests, map[string]any{
					"error":      "Rate limit exceeded",
					"limit":      limit,
					"remaining":  0,
					"retryAfter": 60,
				})
				return
			}

			// Add current request
			rdb.ZAdd(ctx, key, redis.Z{Score: float64(now), Member: fmt.Sprintf("%d", now)})
			rdb.Expire(ctx, key, time.Duration(window)*time.Second)

			remaining := int64(limit) - count - 1
			if remaining < 0 {
				remaining = 0
			}

			w.Header().Set("X-RateLimit-Limit", strconv.Itoa(limit))
			w.Header().Set("X-RateLimit-Remaining", strconv.FormatInt(remaining, 10))
			w.Header().Set("X-RateLimit-Reset", strconv.FormatInt(now/1000+window, 10))

			next.ServeHTTP(w, r)
		})
	}
}

// CreditsMiddleware checks if the API key has enough credits.
func CreditsMiddleware(apiKeyService *service.ApiKeyService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			keyData := GetApiKey(r)
			if keyData == nil {
				next.ServeHTTP(w, r)
				return
			}

			endpoint := extractEndpoint(r.URL.Path)
			estimatedCredits := service.CreditCosts[endpoint]
			if estimatedCredits == 0 {
				estimatedCredits = 1
			}

			ok, err := apiKeyService.HasEnoughCredits(r.Context(), keyData.ID, estimatedCredits)
			if err != nil || !ok {
				writeJSON(w, http.StatusPaymentRequired, map[string]any{
					"error":           "Insufficient credits",
					"creditsRequired": estimatedCredits,
					"creditsUsed":     keyData.CreditsUsed,
					"monthlyCredits":  keyData.MonthlyCredits,
				})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
