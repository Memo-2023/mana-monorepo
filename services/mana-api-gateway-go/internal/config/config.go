package config

import (
	"os"
	"strconv"
	"strings"
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
	DefaultRateLimit     int
	DefaultMonthlyCredits int

	CORSOrigins []string
}

func Load() *Config {
	port, _ := strconv.Atoi(getEnv("PORT", "3030"))
	redisPort, _ := strconv.Atoi(getEnv("REDIS_PORT", "6379"))
	defaultRL, _ := strconv.Atoi(getEnv("DEFAULT_RATE_LIMIT", "10"))
	defaultCredits, _ := strconv.Atoi(getEnv("DEFAULT_MONTHLY_CREDITS", "100"))

	var adminIDs []string
	if ids := os.Getenv("ADMIN_USER_IDS"); ids != "" {
		for _, id := range strings.Split(ids, ",") {
			id = strings.TrimSpace(id)
			if id != "" {
				adminIDs = append(adminIDs, id)
			}
		}
	}

	var origins []string
	if o := os.Getenv("CORS_ORIGINS"); o != "" {
		for _, origin := range strings.Split(o, ",") {
			origin = strings.TrimSpace(origin)
			if origin != "" {
				origins = append(origins, origin)
			}
		}
	}
	if len(origins) == 0 {
		origins = []string{"http://localhost:3000", "http://localhost:5173"}
	}

	return &Config{
		Port:                  port,
		DatabaseURL:           getEnv("DATABASE_URL", "postgresql://manacore:devpassword@localhost:5432/manacore"),
		RedisHost:             getEnv("REDIS_HOST", "localhost"),
		RedisPort:             redisPort,
		RedisPassword:         getEnv("REDIS_PASSWORD", ""),
		RedisPrefix:           getEnv("REDIS_PREFIX", "api-gateway:"),
		SearchURL:             getEnv("SEARCH_SERVICE_URL", "http://localhost:3021"),
		STTURL:                getEnv("STT_SERVICE_URL", "http://localhost:3020"),
		TTSURL:                getEnv("TTS_SERVICE_URL", "http://localhost:3022"),
		AuthURL:               getEnv("MANA_CORE_AUTH_URL", "http://localhost:3001"),
		AdminUserIDs:          adminIDs,
		KeyPrefixLive:         getEnv("API_KEY_PREFIX_LIVE", "sk_live_"),
		KeyPrefixTest:         getEnv("API_KEY_PREFIX_TEST", "sk_test_"),
		DefaultRateLimit:      defaultRL,
		DefaultMonthlyCredits: defaultCredits,
		CORSOrigins:           origins,
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
