package runtime

import (
	"context"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"strings"

	"github.com/mana/mana-matrix-bot/internal/config"
	"github.com/mana/mana-matrix-bot/internal/matrix"
	"github.com/mana/mana-matrix-bot/internal/plugin"
	"github.com/mana/mana-matrix-bot/internal/services"
	"github.com/mana/mana-matrix-bot/internal/session"

	"maunium.net/go/mautrix"
	"maunium.net/go/mautrix/event"
	"maunium.net/go/mautrix/id"
)

// BotInstance represents one active plugin with its Matrix client.
type BotInstance struct {
	Plugin     plugin.Plugin
	Client     *matrix.Client
	Config     plugin.PluginConfig
	MautrixCli *mautrix.Client
	UserID     id.UserID
}

// Runtime manages all plugin lifecycles.
type Runtime struct {
	cfg      *config.Config
	sessions plugin.SessionManager
	auth     *services.AuthClient
	bots     []*BotInstance
	mu       sync.RWMutex
}

// New creates a new Runtime.
func New(cfg *config.Config) *Runtime {
	// Try Redis for sessions, fall back to in-memory
	var sessions plugin.SessionManager
	if cfg.RedisHost != "" {
		redisStore, err := session.NewRedisStore(session.RedisConfig{
			Host:     cfg.RedisHost,
			Port:     cfg.RedisPort,
			Password: cfg.RedisPassword,
		})
		if err != nil {
			slog.Warn("redis unavailable, using in-memory sessions", "error", err)
			sessions = session.NewMemoryStore()
		} else {
			sessions = redisStore
			slog.Info("using redis session store")
		}
	} else {
		sessions = session.NewMemoryStore()
	}

	var auth *services.AuthClient
	if cfg.AuthURL != "" {
		auth = services.NewAuthClient(cfg.AuthURL)
	}

	return &Runtime{
		cfg:      cfg,
		sessions: sessions,
		auth:     auth,
	}
}

// Start initializes all enabled plugins and starts their Matrix sync loops.
func (r *Runtime) Start(ctx context.Context) error {
	factories := plugin.All()
	slog.Info("registered plugin factories", "count", len(factories))

	for name, factory := range factories {
		pluginCfg, ok := r.cfg.Plugins[name]
		if !ok || !pluginCfg.Enabled {
			slog.Info("plugin disabled or not configured", "plugin", name)
			continue
		}

		if pluginCfg.AccessToken == "" {
			slog.Warn("plugin has no access token, skipping", "plugin", name)
			continue
		}

		p := factory()

		// Create Matrix client for this plugin
		storagePath := fmt.Sprintf("%s/sync_%s.json", r.cfg.StoragePath, name)
		client, err := matrix.NewClient(matrix.ClientConfig{
			HomeserverURL: r.cfg.HomeserverURL,
			AccessToken:   pluginCfg.AccessToken,
			StoragePath:   storagePath,
			PluginName:    name,
		})
		if err != nil {
			slog.Error("failed to create matrix client", "plugin", name, "error", err)
			continue
		}

		// Authenticate
		userID, err := client.Login(ctx)
		if err != nil {
			slog.Error("failed to authenticate", "plugin", name, "error", err)
			continue
		}

		// Convert config
		pCfg := plugin.PluginConfig{
			Enabled:      pluginCfg.Enabled,
			AccessToken:  pluginCfg.AccessToken,
			AllowedRooms: pluginCfg.AllowedRooms,
			BackendURL:   pluginCfg.BackendURL,
			Extra:        pluginCfg.Extra,
		}

		// Initialize plugin
		if err := p.Init(ctx, pCfg); err != nil {
			slog.Error("failed to init plugin", "plugin", name, "error", err)
			continue
		}

		bot := &BotInstance{
			Plugin:     p,
			Client:     client,
			Config:     pCfg,
			MautrixCli: client.Inner(),
			UserID:     userID,
		}

		r.mu.Lock()
		r.bots = append(r.bots, bot)
		r.mu.Unlock()

		// Start sync loop for this bot
		go r.startSync(ctx, bot)

		// Start scheduled tasks if plugin implements Scheduler
		if sched, ok := p.(plugin.Scheduler); ok {
			for _, task := range sched.ScheduledTasks() {
				go r.runScheduledTask(ctx, name, task)
			}
		}

		slog.Info("plugin started", "plugin", name, "user_id", userID)
	}

	r.mu.RLock()
	count := len(r.bots)
	r.mu.RUnlock()

	slog.Info("all plugins started", "active", count)
	return nil
}

// Stop gracefully shuts down all plugins.
func (r *Runtime) Stop() {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, bot := range r.bots {
		bot.MautrixCli.StopSync()
		slog.Info("plugin stopped", "plugin", bot.Plugin.Name())
	}
}

// ActivePlugins returns the names of all active plugins.
func (r *Runtime) ActivePlugins() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	names := make([]string, len(r.bots))
	for i, bot := range r.bots {
		names[i] = bot.Plugin.Name()
	}
	return names
}

// startSync starts the Matrix /sync loop for a bot instance.
func (r *Runtime) startSync(ctx context.Context, bot *BotInstance) {
	syncer := bot.MautrixCli.Syncer.(*mautrix.DefaultSyncer)

	// Auto-join rooms on invite
	syncer.OnEventType(event.StateMember, func(ctx context.Context, evt *event.Event) {
		if evt.GetStateKey() == bot.UserID.String() {
			content, ok := evt.Content.Parsed.(*event.MemberEventContent)
			if ok && content.Membership == event.MembershipInvite {
				_, err := bot.MautrixCli.JoinRoomByID(ctx, evt.RoomID)
				if err != nil {
					slog.Error("failed to join room", "plugin", bot.Plugin.Name(), "room", evt.RoomID, "error", err)
				} else {
					slog.Info("joined room", "plugin", bot.Plugin.Name(), "room", evt.RoomID)
				}
			}
		}
	})

	// Handle messages
	syncer.OnEventType(event.EventMessage, func(ctx context.Context, evt *event.Event) {
		r.handleEvent(ctx, bot, evt)
	})

	slog.Info("starting sync", "plugin", bot.Plugin.Name())
	if err := bot.MautrixCli.SyncWithContext(ctx); err != nil && ctx.Err() == nil {
		slog.Error("sync error", "plugin", bot.Plugin.Name(), "error", err)
	}
}

// handleEvent routes an event to the appropriate plugin handler.
func (r *Runtime) handleEvent(ctx context.Context, bot *BotInstance, evt *event.Event) {
	// Ignore own messages
	if evt.Sender == bot.UserID {
		return
	}

	// Ignore messages from other bots
	if matrix.IsBot(evt.Sender.String()) {
		return
	}

	// Ignore edit events
	if matrix.IsEditEvent(evt) {
		return
	}

	// Check room allow-list
	roomID := evt.RoomID.String()
	if len(bot.Config.AllowedRooms) > 0 {
		allowed := false
		for _, r := range bot.Config.AllowedRooms {
			if r == roomID {
				allowed = true
				break
			}
		}
		if !allowed {
			return
		}
	}

	// Build message context
	mc := &plugin.MessageContext{
		RoomID:  roomID,
		Sender:  evt.Sender.String(),
		EventID: evt.ID.String(),
		Client:  bot.Client,
		Session: &plugin.SessionAccess{
			UserID:  evt.Sender.String(),
			Manager: r.sessions,
		},
	}

	pluginName := bot.Plugin.Name()

	// Route by message type
	if matrix.IsTextMessage(evt) {
		mc.Body = matrix.GetMessageBody(evt)
		if mc.Body == "" {
			return
		}

		// Global commands: !login / !logout (handled before plugins)
		if r.handleGlobalCommand(ctx, mc) {
			return
		}

		if err := bot.Client.SetTyping(ctx, roomID, true); err != nil {
			slog.Debug("failed to set typing", "error", err)
		}

		if err := bot.Plugin.HandleTextMessage(ctx, mc); err != nil {
			slog.Error("plugin error", "plugin", pluginName, "error", err)
			bot.Client.SetTyping(ctx, roomID, false)
			bot.Client.SendReply(ctx, roomID, evt.ID.String(), "❌ Ein Fehler ist aufgetreten.")
			return
		}

		bot.Client.SetTyping(ctx, roomID, false)

	} else if matrix.IsAudioMessage(evt) {
		audioHandler, ok := bot.Plugin.(plugin.AudioHandler)
		if !ok {
			return
		}

		mxcURL := matrix.GetMediaURL(evt)
		if mxcURL == "" {
			return
		}

		audioData, err := bot.Client.DownloadMedia(ctx, mxcURL)
		if err != nil {
			slog.Error("download audio failed", "plugin", pluginName, "error", err)
			return
		}

		if err := bot.Client.SetTyping(ctx, roomID, true); err != nil {
			slog.Debug("failed to set typing", "error", err)
		}

		if err := audioHandler.HandleAudioMessage(ctx, mc, audioData); err != nil {
			slog.Error("audio handler error", "plugin", pluginName, "error", err)
			bot.Client.SetTyping(ctx, roomID, false)
			bot.Client.SendReply(ctx, roomID, evt.ID.String(), "❌ Sprachverarbeitung fehlgeschlagen.")
			return
		}

		bot.Client.SetTyping(ctx, roomID, false)

	} else if matrix.IsImageMessage(evt) {
		imageHandler, ok := bot.Plugin.(plugin.ImageHandler)
		if !ok {
			return
		}

		if err := imageHandler.HandleImageMessage(ctx, mc); err != nil {
			slog.Error("image handler error", "plugin", pluginName, "error", err)
		}
	}
}

// handleGlobalCommand intercepts !login and !logout before plugin routing.
// Returns true if the command was handled.
func (r *Runtime) handleGlobalCommand(ctx context.Context, mc *plugin.MessageContext) bool {
	lower := strings.ToLower(mc.Body)

	// !login email password
	if strings.HasPrefix(lower, "!login ") || strings.HasPrefix(lower, "!anmelden ") {
		parts := strings.Fields(mc.Body)
		if len(parts) < 3 {
			mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "**Verwendung:** `!login email passwort`")
			return true
		}

		if r.auth == nil {
			mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Auth-Service nicht konfiguriert.")
			return true
		}

		email := parts[1]
		password := parts[2]

		resp, err := r.auth.Login(ctx, email, password)
		if err != nil {
			slog.Debug("login failed", "email", email, "error", err)
			mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Login fehlgeschlagen. Überprüfe E-Mail und Passwort.")
			return true
		}

		expiresAt := services.TokenExpiresAt(resp)
		r.sessions.SetToken(mc.Sender, resp.Token, expiresAt)

		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("✅ Angemeldet als **%s**", email))
		return true
	}

	// !logout / !abmelden
	if lower == "!logout" || lower == "!abmelden" {
		r.sessions.SetToken(mc.Sender, "", time.Now().Add(-1*time.Hour))
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "✅ Abgemeldet.")
		return true
	}

	return false
}

// runScheduledTask runs a periodic task for a plugin.
func (r *Runtime) runScheduledTask(ctx context.Context, pluginName string, task plugin.ScheduledTask) {
	slog.Info("scheduled task started", "plugin", pluginName, "task", task.Name, "interval", task.Interval)
	ticker := time.NewTicker(task.Interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := task.Run(ctx); err != nil {
				slog.Error("scheduled task failed", "plugin", pluginName, "task", task.Name, "error", err)
			}
		}
	}
}
