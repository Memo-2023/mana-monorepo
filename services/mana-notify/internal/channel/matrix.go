package channel

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"math/rand"
	"net/http"
	"time"

	"github.com/mana/mana-notify/internal/config"
)

type MatrixService struct {
	homeserverURL string
	accessToken   string
	client        *http.Client
}

func NewMatrixService(cfg *config.Config) *MatrixService {
	return &MatrixService{
		homeserverURL: cfg.MatrixHomeserverURL,
		accessToken:   cfg.MatrixAccessToken,
		client:        &http.Client{Timeout: 10 * time.Second},
	}
}

type MatrixMessage struct {
	RoomID        string
	Body          string
	FormattedBody string
	MsgType       string // "m.text" or "m.notice"
}

type MatrixResult struct {
	Success bool
	EventID string
	Error   string
}

func (s *MatrixService) IsConfigured() bool {
	return s.homeserverURL != "" && s.accessToken != ""
}

func (s *MatrixService) Send(ctx context.Context, msg *MatrixMessage) MatrixResult {
	if !s.IsConfigured() {
		return MatrixResult{Success: false, Error: "Matrix not configured"}
	}

	msgType := msg.MsgType
	if msgType == "" {
		msgType = "m.text"
	}

	txnID := fmt.Sprintf("mana_%d_%d", time.Now().UnixMilli(), rand.Intn(100000))

	payload := map[string]string{
		"msgtype": msgType,
		"body":    msg.Body,
	}
	if msg.FormattedBody != "" {
		payload["format"] = "org.matrix.custom.html"
		payload["formatted_body"] = msg.FormattedBody
	}

	body, _ := json.Marshal(payload)

	url := fmt.Sprintf("%s/_matrix/client/v3/rooms/%s/send/m.room.message/%s",
		s.homeserverURL, msg.RoomID, txnID)

	req, err := http.NewRequestWithContext(ctx, http.MethodPut, url, bytes.NewReader(body))
	if err != nil {
		return MatrixResult{Success: false, Error: err.Error()}
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.accessToken)

	resp, err := s.client.Do(req)
	if err != nil {
		slog.Error("matrix send failed", "room", msg.RoomID, "error", err)
		return MatrixResult{Success: false, Error: err.Error()}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return MatrixResult{Success: false, Error: fmt.Sprintf("matrix returned %d", resp.StatusCode)}
	}

	var result struct {
		EventID string `json:"event_id"`
	}
	json.NewDecoder(resp.Body).Decode(&result)

	return MatrixResult{Success: true, EventID: result.EventID}
}
