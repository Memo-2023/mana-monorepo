package config

import (
	"os"
	"strconv"
	"strings"
)

// Config holds all configuration for the consolidated Matrix bot.
type Config struct {
	// Server
	Port int

	// Matrix
	HomeserverURL string
	StoragePath   string

	// Auth
	AuthURL    string
	ServiceKey string

	// Redis
	RedisHost     string
	RedisPort     int
	RedisPassword string

	// Voice services
	STTURL string
	TTSURL string

	// Plugins (keyed by plugin name)
	Plugins map[string]PluginConfig
}

// PluginConfig holds per-plugin configuration.
type PluginConfig struct {
	Enabled      bool
	AccessToken  string
	AllowedRooms []string
	BackendURL   string
	Extra        map[string]string
}

// Load reads configuration from environment variables.
func Load() *Config {
	port, _ := strconv.Atoi(getEnv("PORT", "4000"))
	redisPort, _ := strconv.Atoi(getEnv("REDIS_PORT", "6379"))

	cfg := &Config{
		Port:          port,
		HomeserverURL: getEnv("MATRIX_HOMESERVER_URL", "http://localhost:8008"),
		StoragePath:   getEnv("MATRIX_STORAGE_PATH", "./data"),
		AuthURL:       getEnv("MANA_AUTH_URL", "http://localhost:3001"),
		ServiceKey:    getEnv("MANA_SERVICE_KEY", ""),
		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     redisPort,
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		STTURL:        getEnv("STT_URL", "http://localhost:3020"),
		TTSURL:        getEnv("TTS_URL", "http://localhost:3022"),
		Plugins:       make(map[string]PluginConfig),
	}

	// Load plugin configs from environment variables.
	// Pattern: PLUGIN_{NAME}_ENABLED, PLUGIN_{NAME}_ACCESS_TOKEN, etc.
	// Also supports legacy patterns: MATRIX_{NAME}_BOT_TOKEN
	pluginNames := []string{
		"gateway", "todo", "calendar", "clock", "ollama", "stats",
		"contacts", "chat", "cards", "nutriphi", "picture", "planta",
		"presi", "questions", "skilltree", "storage", "projectdoc",
		"stt", "tts", "zitare", "onboarding",
	}

	// Map of legacy token env var names
	legacyTokenMap := map[string]string{
		"gateway":    "MATRIX_MANA_BOT_TOKEN",
		"todo":       "MATRIX_TODO_BOT_TOKEN",
		"calendar":   "MATRIX_CALENDAR_BOT_TOKEN",
		"clock":      "MATRIX_CLOCK_BOT_TOKEN",
		"ollama":     "MATRIX_OLLAMA_BOT_TOKEN",
		"stats":      "MATRIX_STATS_BOT_TOKEN",
		"contacts":   "MATRIX_CONTACTS_BOT_TOKEN",
		"chat":       "MATRIX_CHAT_BOT_TOKEN",
		"cards":      "MATRIX_CARDS_BOT_TOKEN",
		"nutriphi":   "MATRIX_NUTRIPHI_BOT_TOKEN",
		"picture":    "MATRIX_PICTURE_BOT_TOKEN",
		"planta":     "MATRIX_PLANTA_BOT_TOKEN",
		"presi":      "MATRIX_PRESI_BOT_TOKEN",
		"questions":  "MATRIX_QUESTIONS_BOT_TOKEN",
		"skilltree":  "MATRIX_SKILLTREE_BOT_TOKEN",
		"storage":    "MATRIX_STORAGE_BOT_TOKEN",
		"projectdoc": "MATRIX_PROJECT_DOC_BOT_TOKEN",
		"stt":        "MATRIX_STT_BOT_TOKEN",
		"tts":        "MATRIX_TTS_BOT_TOKEN",
		"zitare":     "MATRIX_ZITARE_BOT_TOKEN",
		"onboarding": "MATRIX_ONBOARDING_BOT_TOKEN",
	}

	legacyRoomsMap := map[string]string{
		"gateway":    "MATRIX_MANA_BOT_ROOMS",
		"todo":       "MATRIX_TODO_BOT_ROOMS",
		"calendar":   "MATRIX_CALENDAR_BOT_ROOMS",
		"clock":      "MATRIX_CLOCK_BOT_ROOMS",
		"ollama":     "MATRIX_OLLAMA_BOT_ROOMS",
		"stats":      "MATRIX_STATS_BOT_ROOMS",
		"contacts":   "MATRIX_CONTACTS_BOT_ROOMS",
		"chat":       "MATRIX_CHAT_BOT_ROOMS",
		"cards":      "MATRIX_CARDS_BOT_ROOMS",
		"nutriphi":   "MATRIX_NUTRIPHI_BOT_ROOMS",
		"picture":    "MATRIX_PICTURE_BOT_ROOMS",
		"planta":     "MATRIX_PLANTA_BOT_ROOMS",
		"presi":      "MATRIX_PRESI_BOT_ROOMS",
		"questions":  "MATRIX_QUESTIONS_BOT_ROOMS",
		"skilltree":  "MATRIX_SKILLTREE_BOT_ROOMS",
		"storage":    "MATRIX_STORAGE_BOT_ROOMS",
		"projectdoc": "MATRIX_PROJECT_DOC_BOT_ROOMS",
		"stt":        "MATRIX_STT_BOT_ROOMS",
		"tts":        "MATRIX_TTS_BOT_ROOMS",
		"zitare":     "MATRIX_ZITARE_BOT_ROOMS",
		"onboarding": "MATRIX_ONBOARDING_BOT_ROOMS",
	}

	// Backend URL defaults per plugin
	backendURLMap := map[string]string{
		"todo":       "TODO_BACKEND_URL",
		"calendar":   "CALENDAR_BACKEND_URL",
		"clock":      "CLOCK_BACKEND_URL",
		"contacts":   "CONTACTS_BACKEND_URL",
		"chat":       "CHAT_BACKEND_URL",
		"cards":      "CARDS_BACKEND_URL",
		"nutriphi":   "NUTRIPHI_BACKEND_URL",
		"picture":    "PICTURE_BACKEND_URL",
		"planta":     "PLANTA_BACKEND_URL",
		"presi":      "PRESI_BACKEND_URL",
		"questions":  "QUESTIONS_BACKEND_URL",
		"skilltree":  "SKILLTREE_BACKEND_URL",
		"storage":    "STORAGE_BACKEND_URL",
		"projectdoc": "PROJECTDOC_BACKEND_URL",
		"zitare":     "ZITARE_BACKEND_URL",
	}

	for _, name := range pluginNames {
		upper := strings.ToUpper(name)

		// Access token: try PLUGIN_*_ACCESS_TOKEN first, then legacy
		token := os.Getenv("PLUGIN_" + upper + "_ACCESS_TOKEN")
		if token == "" {
			if legacyEnv, ok := legacyTokenMap[name]; ok {
				token = os.Getenv(legacyEnv)
			}
		}

		// Enabled: explicit env or auto-detect from token presence
		enabledStr := os.Getenv("PLUGIN_" + upper + "_ENABLED")
		enabled := token != ""
		if enabledStr != "" {
			enabled = enabledStr == "true" || enabledStr == "1"
		}

		// Allowed rooms
		var rooms []string
		roomsStr := os.Getenv("PLUGIN_" + upper + "_ALLOWED_ROOMS")
		if roomsStr == "" {
			if legacyEnv, ok := legacyRoomsMap[name]; ok {
				roomsStr = os.Getenv(legacyEnv)
			}
		}
		if roomsStr != "" {
			for _, r := range strings.Split(roomsStr, ",") {
				r = strings.TrimSpace(r)
				if r != "" {
					rooms = append(rooms, r)
				}
			}
		}

		// Backend URL
		backendURL := ""
		if envName, ok := backendURLMap[name]; ok {
			backendURL = os.Getenv(envName)
		}

		// Extra config (plugin-specific env vars)
		extra := make(map[string]string)
		// Ollama-specific
		if name == "ollama" || name == "gateway" {
			extra["ollama_url"] = getEnv("OLLAMA_URL", "http://localhost:11434")
			extra["ollama_model"] = getEnv("OLLAMA_MODEL", "gemma3:4b")
		}
		if name == "stt" || name == "gateway" {
			extra["stt_url"] = cfg.STTURL
		}
		if name == "tts" || name == "gateway" {
			extra["tts_url"] = cfg.TTSURL
		}
		// Gateway needs backend URLs for sub-handlers
		if name == "gateway" {
			extra["todo_url"] = getEnv("TODO_BACKEND_URL", "")
			extra["calendar_url"] = getEnv("CALENDAR_BACKEND_URL", "")
			extra["clock_url"] = getEnv("CLOCK_BACKEND_URL", "")
		}

		cfg.Plugins[name] = PluginConfig{
			Enabled:      enabled,
			AccessToken:  token,
			AllowedRooms: rooms,
			BackendURL:   backendURL,
			Extra:        extra,
		}
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
