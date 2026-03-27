package matrix

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"time"

	"maunium.net/go/mautrix"
	"maunium.net/go/mautrix/event"
	"maunium.net/go/mautrix/id"
)

var mxcRegex = regexp.MustCompile(`^mxc://([^/]+)/(.+)$`)

// Client wraps mautrix.Client and implements the plugin.MatrixClient interface.
type Client struct {
	inner       *mautrix.Client
	homeserver  string
	accessToken string
	storagePath string
	logger      *slog.Logger
}

// ClientConfig holds configuration for creating a Matrix client.
type ClientConfig struct {
	HomeserverURL string
	AccessToken   string
	StoragePath   string // path for sync state file
	PluginName    string
}

// NewClient creates a new Matrix client wrapper.
func NewClient(cfg ClientConfig) (*Client, error) {
	userID := id.UserID("") // will be resolved via whoami

	client, err := mautrix.NewClient(cfg.HomeserverURL, userID, cfg.AccessToken)
	if err != nil {
		return nil, fmt.Errorf("create mautrix client: %w", err)
	}

	// Ensure storage directory exists
	if cfg.StoragePath != "" {
		dir := filepath.Dir(cfg.StoragePath)
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return nil, fmt.Errorf("create storage dir: %w", err)
		}
	}

	logger := slog.With("plugin", cfg.PluginName)

	return &Client{
		inner:       client,
		homeserver:  cfg.HomeserverURL,
		accessToken: cfg.AccessToken,
		storagePath: cfg.StoragePath,
		logger:      logger,
	}, nil
}

// Inner returns the underlying mautrix.Client for advanced operations.
func (c *Client) Inner() *mautrix.Client {
	return c.inner
}

// Login resolves the bot's user ID via /whoami.
func (c *Client) Login(ctx context.Context) (id.UserID, error) {
	resp, err := c.inner.Whoami(ctx)
	if err != nil {
		return "", fmt.Errorf("whoami: %w", err)
	}
	c.inner.UserID = resp.UserID
	c.logger.Info("authenticated", "user_id", resp.UserID)
	return resp.UserID, nil
}

// GetUserID returns the bot's Matrix user ID.
func (c *Client) GetUserID() string {
	return c.inner.UserID.String()
}

// SendMessage sends a text message with markdown formatting to a room.
func (c *Client) SendMessage(ctx context.Context, roomID string, text string) (string, error) {
	content := &event.MessageEventContent{
		MsgType:       event.MsgText,
		Body:          text,
		Format:        event.FormatHTML,
		FormattedBody: MarkdownToHTML(text),
	}
	resp, err := c.inner.SendMessageEvent(ctx, id.RoomID(roomID), event.EventMessage, content)
	if err != nil {
		return "", err
	}
	return resp.EventID.String(), nil
}

// SendReply sends a reply to a specific event.
func (c *Client) SendReply(ctx context.Context, roomID string, eventID string, text string) (string, error) {
	content := &event.MessageEventContent{
		MsgType:       event.MsgText,
		Body:          text,
		Format:        event.FormatHTML,
		FormattedBody: MarkdownToHTML(text),
	}
	content.SetReply(&event.Event{
		RoomID: id.RoomID(roomID),
		ID:     id.EventID(eventID),
	})
	resp, err := c.inner.SendMessageEvent(ctx, id.RoomID(roomID), event.EventMessage, content)
	if err != nil {
		return "", err
	}
	return resp.EventID.String(), nil
}

// SendNotice sends a notice (non-highlighted message).
func (c *Client) SendNotice(ctx context.Context, roomID string, text string) (string, error) {
	content := &event.MessageEventContent{
		MsgType:       event.MsgNotice,
		Body:          text,
		Format:        event.FormatHTML,
		FormattedBody: MarkdownToHTML(text),
	}
	resp, err := c.inner.SendMessageEvent(ctx, id.RoomID(roomID), event.EventMessage, content)
	if err != nil {
		return "", err
	}
	return resp.EventID.String(), nil
}

// EditMessage edits an existing message.
func (c *Client) EditMessage(ctx context.Context, roomID string, eventID string, text string) (string, error) {
	content := map[string]any{
		"msgtype":        "m.text",
		"body":           "* " + text,
		"format":         "org.matrix.custom.html",
		"formatted_body": "* " + MarkdownToHTML(text),
		"m.relates_to": map[string]any{
			"rel_type": "m.replace",
			"event_id": eventID,
		},
		"m.new_content": map[string]any{
			"msgtype":        "m.text",
			"body":           text,
			"format":         "org.matrix.custom.html",
			"formatted_body": MarkdownToHTML(text),
		},
	}
	resp, err := c.inner.SendMessageEvent(ctx, id.RoomID(roomID), event.EventMessage, content)
	if err != nil {
		return "", err
	}
	return resp.EventID.String(), nil
}

// SetTyping sets the typing indicator for the bot in a room.
func (c *Client) SetTyping(ctx context.Context, roomID string, typing bool) error {
	timeout := time.Duration(0)
	if typing {
		timeout = 30 * time.Second
	}
	_, err := c.inner.UserTyping(ctx, id.RoomID(roomID), typing, timeout)
	return err
}

// DownloadMedia downloads media from a mxc:// URL.
func (c *Client) DownloadMedia(ctx context.Context, mxcURL string) ([]byte, error) {
	matches := mxcRegex.FindStringSubmatch(mxcURL)
	if len(matches) != 3 {
		return nil, fmt.Errorf("invalid mxc URL: %s", mxcURL)
	}

	serverName := matches[1]
	mediaID := matches[2]

	// Try authenticated media API (Matrix spec v1.11+)
	url := fmt.Sprintf("%s/_matrix/client/v1/media/download/%s/%s", c.homeserver, serverName, mediaID)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.accessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("download media: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// Fallback to legacy API
		url = fmt.Sprintf("%s/_matrix/media/v3/download/%s/%s", c.homeserver, serverName, mediaID)
		req2, err := http.NewRequestWithContext(ctx, "GET", url, nil)
		if err != nil {
			return nil, err
		}
		resp2, err := http.DefaultClient.Do(req2)
		if err != nil {
			return nil, fmt.Errorf("download media (legacy): %w", err)
		}
		defer resp2.Body.Close()
		if resp2.StatusCode != http.StatusOK {
			return nil, fmt.Errorf("download media failed: %d", resp2.StatusCode)
		}
		return io.ReadAll(resp2.Body)
	}

	return io.ReadAll(resp.Body)
}

// UploadMedia uploads media and returns the mxc:// URL.
func (c *Client) UploadMedia(ctx context.Context, data []byte, contentType string, filename string) (string, error) {
	resp, err := c.inner.UploadBytes(ctx, data, contentType)
	if err != nil {
		return "", fmt.Errorf("upload media: %w", err)
	}
	return resp.ContentURI.String(), nil
}

// SendAudio sends an audio message to a room.
func (c *Client) SendAudio(ctx context.Context, roomID string, mxcURL string, filename string, size int) (string, error) {
	content := &event.MessageEventContent{
		MsgType: event.MsgAudio,
		Body:    filename,
		URL:     id.ContentURIString(mxcURL),
		Info: &event.FileInfo{
			MimeType: "audio/mpeg",
			Size:     size,
		},
	}
	resp, err := c.inner.SendMessageEvent(ctx, id.RoomID(roomID), event.EventMessage, content)
	if err != nil {
		return "", err
	}
	return resp.EventID.String(), nil
}
