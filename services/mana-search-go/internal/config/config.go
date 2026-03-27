package config

import (
	"os"
	"strconv"
	"strings"
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
		Port: getEnvInt("PORT", 3021),

		SearxngURL:             getEnv("SEARXNG_URL", "http://localhost:8080"),
		SearxngTimeout:         getEnvInt("SEARXNG_TIMEOUT", 15000),
		SearxngDefaultLanguage: getEnv("SEARXNG_DEFAULT_LANGUAGE", "de-DE"),

		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     getEnvInt("REDIS_PORT", 6379),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisPrefix:   "mana-search:",

		CacheSearchTTL:  getEnvInt("CACHE_SEARCH_TTL", 3600),
		CacheExtractTTL: getEnvInt("CACHE_EXTRACT_TTL", 86400),

		ExtractTimeout:   getEnvInt("EXTRACT_TIMEOUT", 10000),
		ExtractMaxLength: getEnvInt("EXTRACT_MAX_LENGTH", 50000),
		ExtractUserAgent: getEnv("EXTRACT_USER_AGENT", "Mozilla/5.0 (compatible; ManaSearchBot/1.0; +https://mana.how)"),

		CORSOrigins: getEnvSlice("CORS_ORIGINS", []string{"http://localhost:3000", "http://localhost:5173", "http://localhost:8081"}),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}

func getEnvSlice(key string, fallback []string) []string {
	if v := os.Getenv(key); v != "" {
		return strings.Split(v, ",")
	}
	return fallback
}
