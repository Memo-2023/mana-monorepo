package config

import (
	"strings"

	"github.com/manacore/shared-go/envutil"
)

type Config struct {
	Port int

	DatabaseURL string

	RedisHost     string
	RedisPort     int
	RedisPassword string
	RedisPrefix   string

	// Backend service URLs
	SearchURL string
	STTURL    string
	TTSURL    string

	// Auth
	AuthURL      string
	AdminUserIDs []string

	// API Key settings
	KeyPrefixLive string
	KeyPrefixTest string

	// Defaults
	DefaultRateLimit      int
	DefaultMonthlyCredits int

	CORSOrigins []string
}

func Load() *Config {
	// Parse admin IDs (trim whitespace)
	var adminIDs []string
	for _, id := range envutil.GetSlice("ADMIN_USER_IDS", nil) {
		id = strings.TrimSpace(id)
		if id != "" {
			adminIDs = append(adminIDs, id)
		}
	}

	// Parse CORS origins (trim whitespace)
	origins := envutil.GetSlice("CORS_ORIGINS", []string{"http://localhost:3000", "http://localhost:5173"})
	for i, o := range origins {
		origins[i] = strings.TrimSpace(o)
	}

	return &Config{
		Port:                  envutil.GetInt("PORT", 3030),
		DatabaseURL:           envutil.Get("DATABASE_URL", "postgresql://manacore:devpassword@localhost:5432/manacore"),
		RedisHost:             envutil.Get("REDIS_HOST", "localhost"),
		RedisPort:             envutil.GetInt("REDIS_PORT", 6379),
		RedisPassword:         envutil.Get("REDIS_PASSWORD", ""),
		RedisPrefix:           envutil.Get("REDIS_PREFIX", "api-gateway:"),
		SearchURL:             envutil.Get("SEARCH_SERVICE_URL", "http://localhost:3021"),
		STTURL:                envutil.Get("STT_SERVICE_URL", "http://localhost:3020"),
		TTSURL:                envutil.Get("TTS_SERVICE_URL", "http://localhost:3022"),
		AuthURL:               envutil.Get("MANA_CORE_AUTH_URL", "http://localhost:3001"),
		AdminUserIDs:          adminIDs,
		KeyPrefixLive:         envutil.Get("API_KEY_PREFIX_LIVE", "sk_live_"),
		KeyPrefixTest:         envutil.Get("API_KEY_PREFIX_TEST", "sk_test_"),
		DefaultRateLimit:      envutil.GetInt("DEFAULT_RATE_LIMIT", 10),
		DefaultMonthlyCredits: envutil.GetInt("DEFAULT_MONTHLY_CREDITS", 100),
		CORSOrigins:           origins,
	}
}
