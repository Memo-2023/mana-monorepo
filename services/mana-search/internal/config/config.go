package config

import (
	"github.com/mana/shared-go/envutil"
)

type Config struct {
	Port int

	// SearXNG
	SearxngURL             string
	SearxngTimeout         int // ms
	SearxngDefaultLanguage string

	// Redis
	RedisHost     string
	RedisPort     int
	RedisPassword string
	RedisPrefix   string

	// Cache TTLs (seconds)
	CacheSearchTTL  int
	CacheExtractTTL int

	// Extract
	ExtractTimeout   int // ms
	ExtractMaxLength int
	ExtractUserAgent string

	// CORS
	CORSOrigins []string
}

func Load() *Config {
	return &Config{
		Port: envutil.GetInt("PORT", 3021),

		SearxngURL:             envutil.Get("SEARXNG_URL", "http://localhost:8080"),
		SearxngTimeout:         envutil.GetInt("SEARXNG_TIMEOUT", 15000),
		SearxngDefaultLanguage: envutil.Get("SEARXNG_DEFAULT_LANGUAGE", "de-DE"),

		RedisHost:     envutil.Get("REDIS_HOST", "localhost"),
		RedisPort:     envutil.GetInt("REDIS_PORT", 6379),
		RedisPassword: envutil.Get("REDIS_PASSWORD", ""),
		RedisPrefix:   "mana-search:",

		CacheSearchTTL:  envutil.GetInt("CACHE_SEARCH_TTL", 3600),
		CacheExtractTTL: envutil.GetInt("CACHE_EXTRACT_TTL", 86400),

		ExtractTimeout:   envutil.GetInt("EXTRACT_TIMEOUT", 10000),
		ExtractMaxLength: envutil.GetInt("EXTRACT_MAX_LENGTH", 50000),
		ExtractUserAgent: envutil.Get("EXTRACT_USER_AGENT", "Mozilla/5.0 (compatible; ManaSearchBot/1.0; +https://mana.how)"),

		CORSOrigins: envutil.GetSlice("CORS_ORIGINS", []string{"http://localhost:3000", "http://localhost:5173", "http://localhost:8081"}),
	}
}
