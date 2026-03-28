// Package envutil provides shared environment variable helpers for ManaCore Go services.
package envutil

import (
	"os"
	"strconv"
	"strings"
)

// Get returns an environment variable value or a fallback default.
func Get(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// GetInt returns an environment variable as int or a fallback default.
func GetInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}

// GetBool returns an environment variable as bool or a fallback default.
func GetBool(key string, fallback bool) bool {
	if v := os.Getenv(key); v != "" {
		if b, err := strconv.ParseBool(v); err == nil {
			return b
		}
	}
	return fallback
}

// GetSlice returns an environment variable as a comma-separated slice or a fallback default.
func GetSlice(key string, fallback []string) []string {
	if v := os.Getenv(key); v != "" {
		return strings.Split(v, ",")
	}
	return fallback
}
