package plugin

import (
	"context"
	"time"
)

// MessageContext carries all information about an incoming message.
type MessageContext struct {
	RoomID  string
	Sender  string
	EventID string
	Body    string // text body (for text messages)
	IsVoice bool   // true if transcribed from audio
	Client  MatrixClient
	Session *SessionAccess
}

// MatrixClient is the interface plugins use to interact with Matrix.
type MatrixClient interface {
	SendMessage(ctx context.Context, roomID string, text string) (string, error)
	SendReply(ctx context.Context, roomID string, eventID string, text string) (string, error)
	SendNotice(ctx context.Context, roomID string, text string) (string, error)
	EditMessage(ctx context.Context, roomID string, eventID string, text string) (string, error)
	SetTyping(ctx context.Context, roomID string, typing bool) error
	DownloadMedia(ctx context.Context, mxcURL string) ([]byte, error)
	UploadMedia(ctx context.Context, data []byte, contentType string, filename string) (string, error)
	SendAudio(ctx context.Context, roomID string, mxcURL string, filename string, size int) (string, error)
	GetUserID() string
}

// SessionAccess provides per-user session operations for a plugin.
type SessionAccess struct {
	UserID  string
	Manager SessionManager
}

// SessionManager is the interface for session storage.
type SessionManager interface {
	Get(userID, key string) (any, bool)
	Set(userID, key string, value any)
	Delete(userID, key string)
	GetToken(userID string) (string, bool)
	SetToken(userID, token string, expiresAt time.Time)
	IsLoggedIn(userID string) bool
}

// Plugin is the interface every bot plugin must implement.
type Plugin interface {
	// Name returns the unique plugin identifier (e.g., "todo", "calendar").
	Name() string

	// Init is called once during startup with the plugin's config.
	Init(ctx context.Context, cfg PluginConfig) error

	// HandleTextMessage is called for m.text events.
	HandleTextMessage(ctx context.Context, mc *MessageContext) error

	// Commands returns the list of commands this plugin handles.
	Commands() []CommandDef
}

// AudioHandler is optionally implemented by plugins that handle voice messages.
type AudioHandler interface {
	HandleAudioMessage(ctx context.Context, mc *MessageContext, audioData []byte) error
}

// ImageHandler is optionally implemented by plugins that handle image messages.
type ImageHandler interface {
	HandleImageMessage(ctx context.Context, mc *MessageContext) error
}

// Scheduler is optionally implemented by plugins that need periodic tasks.
type Scheduler interface {
	ScheduledTasks() []ScheduledTask
}

// ScheduledTask defines a periodic task.
type ScheduledTask struct {
	Name     string
	Interval time.Duration
	Run      func(ctx context.Context) error
}

// CommandDef describes a command for help text and routing.
type CommandDef struct {
	Patterns    []string // e.g., ["!todo", "!add", "!neu"]
	Description string
	Category    string // e.g., "Aufgaben", "Kalender"
}

// PluginConfig holds per-plugin configuration.
type PluginConfig struct {
	Enabled      bool
	AccessToken  string
	AllowedRooms []string
	BackendURL   string
	Extra        map[string]string
}
