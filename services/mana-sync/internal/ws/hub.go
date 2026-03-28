package ws

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/coder/websocket"
	"github.com/manacore/mana-sync/internal/auth"
)

// Message types sent over WebSocket.
type Message struct {
	Type   string   `json:"type"`
	Tables []string `json:"tables,omitempty"`
	Token  string   `json:"token,omitempty"`
}

// Client represents a connected WebSocket client.
type Client struct {
	UserID string
	AppID  string
	Conn   *websocket.Conn
	cancel context.CancelFunc
}

// Hub manages WebSocket connections and broadcasts sync notifications.
type Hub struct {
	// clients maps userID -> set of clients
	clients   map[string]map[*Client]struct{}
	mu        sync.RWMutex
	validator *auth.Validator
}

// NewHub creates a new WebSocket hub.
func NewHub(validator *auth.Validator) *Hub {
	return &Hub{
		clients:   make(map[string]map[*Client]struct{}),
		validator: validator,
	}
}

// HandleWebSocket upgrades an HTTP connection to WebSocket and registers the client.
// The client must send an auth message with a valid JWT before receiving notifications.
func (h *Hub) HandleWebSocket(w http.ResponseWriter, r *http.Request, appID string) {
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		OriginPatterns: []string{"*"},
	})
	if err != nil {
		slog.Error("websocket accept failed", "error", err)
		return
	}

	ctx, cancel := context.WithCancel(r.Context())
	client := &Client{
		AppID:  appID,
		Conn:   conn,
		cancel: cancel,
	}

	// Read loop: handle auth and other messages
	go h.readLoop(ctx, client)
}

// NotifyUser sends a sync-available message to all connected clients of a user,
// except the client that originated the change.
func (h *Hub) NotifyUser(userID, appID, excludeClientID string, tables []string) {
	h.mu.RLock()
	clients, ok := h.clients[userID]
	if !ok {
		h.mu.RUnlock()
		return
	}

	// Copy the client set under read lock to avoid holding lock during writes
	clientsCopy := make([]*Client, 0, len(clients))
	for client := range clients {
		if client.AppID == appID {
			clientsCopy = append(clientsCopy, client)
		}
	}
	h.mu.RUnlock()

	if len(clientsCopy) == 0 {
		return
	}

	msg := Message{
		Type:   "sync-available",
		Tables: tables,
	}
	data, err := json.Marshal(msg)
	if err != nil {
		slog.Error("failed to marshal notification", "error", err)
		return
	}

	for _, client := range clientsCopy {
		go func(c *Client) {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if err := c.Conn.Write(ctx, websocket.MessageText, data); err != nil {
				h.removeClient(c)
			}
		}(client)
	}
}

func (h *Hub) readLoop(ctx context.Context, client *Client) {
	defer func() {
		h.removeClient(client)
		client.Conn.Close(websocket.StatusNormalClosure, "closing")
		client.cancel()
	}()

	// Client must authenticate within 10 seconds
	authDeadline := time.After(10 * time.Second)
	authenticated := false

	for {
		select {
		case <-authDeadline:
			if !authenticated {
				slog.Warn("websocket client failed to authenticate in time", "appID", client.AppID)
				client.Conn.Close(websocket.StatusPolicyViolation, "auth timeout")
				return
			}
		default:
		}

		_, data, err := client.Conn.Read(ctx)
		if err != nil {
			return
		}

		var msg Message
		if err := json.Unmarshal(data, &msg); err != nil {
			continue
		}

		switch msg.Type {
		case "auth":
			if msg.Token == "" {
				errMsg := Message{Type: "error", Tables: []string{"missing token"}}
				errData, _ := json.Marshal(errMsg)
				client.Conn.Write(ctx, websocket.MessageText, errData)
				continue
			}

			// Validate JWT via JWKS (same as HTTP endpoints)
			claims, err := h.validator.ValidateToken(msg.Token)
			if err != nil {
				slog.Warn("websocket auth failed", "error", err, "appID", client.AppID)
				errMsg := Message{Type: "error", Tables: []string{"invalid token"}}
				errData, _ := json.Marshal(errMsg)
				client.Conn.Write(ctx, websocket.MessageText, errData)
				client.Conn.Close(websocket.StatusPolicyViolation, "invalid token")
				return
			}

			if claims.Subject == "" {
				client.Conn.Close(websocket.StatusPolicyViolation, "missing subject")
				return
			}

			client.UserID = claims.Subject
			h.addClient(client)
			authenticated = true

			// Send auth confirmation
			ackMsg := Message{Type: "auth-ok"}
			ackData, _ := json.Marshal(ackMsg)
			client.Conn.Write(ctx, websocket.MessageText, ackData)

			slog.Info("websocket authenticated", "userID", client.UserID, "appID", client.AppID)

		case "ping":
			pongMsg := Message{Type: "pong"}
			pongData, _ := json.Marshal(pongMsg)
			client.Conn.Write(ctx, websocket.MessageText, pongData)
		}
	}
}

// SetClientUserID updates the user ID after JWT validation.
// Called by the sync handler when it knows the real user ID.
func (h *Hub) SetClientUserID(client *Client, userID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Remove from old mapping
	if client.UserID != "" {
		if clients, ok := h.clients[client.UserID]; ok {
			delete(clients, client)
			if len(clients) == 0 {
				delete(h.clients, client.UserID)
			}
		}
	}

	// Add to new mapping
	client.UserID = userID
	if _, ok := h.clients[userID]; !ok {
		h.clients[userID] = make(map[*Client]struct{})
	}
	h.clients[userID][client] = struct{}{}
}

func (h *Hub) addClient(client *Client) {
	if client.UserID == "" {
		return
	}
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.clients[client.UserID]; !ok {
		h.clients[client.UserID] = make(map[*Client]struct{})
	}
	h.clients[client.UserID][client] = struct{}{}

	slog.Info("client connected", "userID", client.UserID, "appID", client.AppID)
}

func (h *Hub) removeClient(client *Client) {
	if client.UserID == "" {
		return
	}
	h.mu.Lock()
	defer h.mu.Unlock()

	if clients, ok := h.clients[client.UserID]; ok {
		delete(clients, client)
		if len(clients) == 0 {
			delete(h.clients, client.UserID)
		}
	}

	slog.Info("client disconnected", "userID", client.UserID, "appID", client.AppID)
}

// ConnectedUsers returns the number of unique connected users.
func (h *Hub) ConnectedUsers() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// TotalConnections returns the total number of WebSocket connections.
func (h *Hub) TotalConnections() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	total := 0
	for _, clients := range h.clients {
		total += len(clients)
	}
	return total
}
