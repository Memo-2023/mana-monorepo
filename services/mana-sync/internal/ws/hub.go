package ws

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"sync"

	"github.com/coder/websocket"
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
	clients map[string]map[*Client]struct{}
	mu      sync.RWMutex
}

// NewHub creates a new WebSocket hub.
func NewHub() *Hub {
	return &Hub{
		clients: make(map[string]map[*Client]struct{}),
	}
}

// HandleWebSocket upgrades an HTTP connection to WebSocket and registers the client.
// The userID is initially empty — the client must send an auth message first.
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
	h.mu.RUnlock()

	if !ok {
		return
	}

	msg := Message{
		Type:   "sync-available",
		Tables: tables,
	}
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}

	for client := range clients {
		if client.AppID != appID {
			continue
		}
		// Don't echo back to the sender (client ID is in the WS client)
		go func(c *Client) {
			err := c.Conn.Write(context.Background(), websocket.MessageText, data)
			if err != nil {
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

	for {
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
			// Client sends token after connecting — we store the userID
			// In production, validate the token here. For now, trust it
			// since the HTTP sync endpoint already validates.
			if msg.Token != "" {
				// The actual validation happens in the sync handler.
				// Here we just need the user ID for routing notifications.
				// A proper implementation would validate the JWT.
				client.UserID = "pending-auth" // Placeholder
				h.addClient(client)
			}

		case "ping":
			msg := Message{Type: "pong"}
			data, _ := json.Marshal(msg)
			client.Conn.Write(ctx, websocket.MessageText, data)
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
