package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/manacore/shared-go/httputil"
	"time"

	"github.com/manacore/mana-notify/internal/db"
	"github.com/manacore/mana-notify/internal/queue"
	tmpl "github.com/manacore/mana-notify/internal/template"
)

type NotificationsHandler struct {
	db     *db.DB
	pool   *queue.WorkerPool
	engine *tmpl.Engine
}

func NewNotificationsHandler(database *db.DB, pool *queue.WorkerPool, engine *tmpl.Engine) *NotificationsHandler {
	return &NotificationsHandler{db: database, pool: pool, engine: engine}
}

type SendRequest struct {
	Channel    string         `json:"channel"`
	AppID      string         `json:"appId"`
	UserID     string         `json:"userId,omitempty"`
	Recipient  string         `json:"recipient,omitempty"`
	Recipients []string       `json:"recipients,omitempty"`
	Template   string         `json:"template,omitempty"`
	Subject    string         `json:"subject,omitempty"`
	Body       string         `json:"body,omitempty"`
	Data       map[string]any `json:"data,omitempty"`
	Priority   string         `json:"priority,omitempty"`
	ExternalID string         `json:"externalId,omitempty"`

	EmailOptions   *EmailOptions   `json:"emailOptions,omitempty"`
	PushOptions    *PushOptions    `json:"pushOptions,omitempty"`
	WebhookOptions *WebhookOptions `json:"webhookOptions,omitempty"`
	MatrixOptions  *MatrixOptions  `json:"matrixOptions,omitempty"`
}

type EmailOptions struct {
	From    string `json:"from,omitempty"`
	ReplyTo string `json:"replyTo,omitempty"`
}

type PushOptions struct {
	Sound     string `json:"sound,omitempty"`
	Badge     *int   `json:"badge,omitempty"`
	ChannelID string `json:"channelId,omitempty"`
}

type WebhookOptions struct {
	Method  string            `json:"method,omitempty"`
	Headers map[string]string `json:"headers,omitempty"`
	Timeout int               `json:"timeout,omitempty"`
}

type MatrixOptions struct {
	MsgType       string `json:"msgtype,omitempty"`
	FormattedBody string `json:"formattedBody,omitempty"`
}

type ScheduleRequest struct {
	SendRequest
	ScheduledFor string `json:"scheduledFor"`
}

type BatchRequest struct {
	Notifications []SendRequest `json:"notifications"`
}

// Send handles POST /api/v1/notifications/send
func (h *NotificationsHandler) Send(w http.ResponseWriter, r *http.Request) {
	var req SendRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		httputil.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := validateSendRequest(&req); err != nil {
		httputil.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Check idempotency
	if req.ExternalID != "" {
		var existingID string
		err := h.db.Pool.QueryRow(r.Context(),
			`SELECT id FROM notify.notifications WHERE external_id = $1`, req.ExternalID,
		).Scan(&existingID)
		if err == nil {
			httputil.WriteJSON(w, http.StatusOK, map[string]any{
				"notification": map[string]any{"id": existingID, "status": "existing"},
				"deduplicated": true,
			})
			return
		}
	}

	// Check user preferences
	if req.UserID != "" {
		blocked, reason := h.checkPreferences(r.Context(), req.UserID, req.Channel)
		if blocked {
			httputil.WriteJSON(w, http.StatusOK, map[string]any{
				"notification": map[string]any{"status": "cancelled", "reason": reason},
			})
			return
		}
	}

	// Render template
	subject := req.Subject
	body := req.Body
	if req.Template != "" {
		rendered, err := h.engine.RenderBySlug(r.Context(), req.Template, req.Data, "")
		if err != nil {
			slog.Warn("template render failed", "template", req.Template, "error", err)
		} else {
			if rendered.Subject != "" {
				subject = rendered.Subject
			}
			if rendered.Body != "" {
				body = rendered.Body
			}
		}
	}

	priority := req.Priority
	if priority == "" {
		priority = "normal"
	}

	// Create notification record
	var notificationID string
	err := h.db.Pool.QueryRow(r.Context(),
		`INSERT INTO notify.notifications (user_id, app_id, channel, template_id, subject, body, data, priority, recipient, external_id)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		 RETURNING id`,
		nilIfEmpty(req.UserID), req.AppID, req.Channel, nilIfEmpty(req.Template),
		nilIfEmpty(subject), nilIfEmpty(body), jsonOrNil(req.Data),
		priority, nilIfEmpty(req.Recipient), nilIfEmpty(req.ExternalID),
	).Scan(&notificationID)
	if err != nil {
		slog.Error("create notification failed", "error", err)
		httputil.WriteError(w, http.StatusInternalServerError, "failed to create notification")
		return
	}

	// Build and enqueue job
	job := queue.Job{
		NotificationID: notificationID,
		Channel:        req.Channel,
		AppID:          req.AppID,
		Recipient:      req.Recipient,
		Subject:        subject,
		Body:           body,
		Data:           req.Data,
	}

	if req.EmailOptions != nil {
		job.From = req.EmailOptions.From
		job.ReplyTo = req.EmailOptions.ReplyTo
	}
	if req.PushOptions != nil {
		job.Sound = req.PushOptions.Sound
		job.Badge = req.PushOptions.Badge
	}
	if req.MatrixOptions != nil {
		job.RoomID = req.Recipient
		job.MsgType = req.MatrixOptions.MsgType
		job.FormattedBody = req.MatrixOptions.FormattedBody
	}
	if req.WebhookOptions != nil {
		job.WebhookMethod = req.WebhookOptions.Method
		job.WebhookHeaders = req.WebhookOptions.Headers
		job.WebhookTimeout = req.WebhookOptions.Timeout
	}
	if req.Channel == "matrix" {
		job.RoomID = req.Recipient
	}

	h.pool.Enqueue(job)

	httputil.WriteJSON(w, http.StatusAccepted, map[string]any{
		"notification": map[string]any{
			"id":     notificationID,
			"status": "pending",
		},
	})
}

// Schedule handles POST /api/v1/notifications/schedule
func (h *NotificationsHandler) Schedule(w http.ResponseWriter, r *http.Request) {
	var req ScheduleRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		httputil.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	scheduledFor, err := time.Parse(time.RFC3339, req.ScheduledFor)
	if err != nil {
		httputil.WriteError(w, http.StatusBadRequest, "scheduledFor must be a valid RFC3339 timestamp")
		return
	}
	if scheduledFor.Before(time.Now()) {
		httputil.WriteError(w, http.StatusBadRequest, "scheduledFor must be in the future")
		return
	}

	if err := validateSendRequest(&req.SendRequest); err != nil {
		httputil.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Render template
	subject := req.Subject
	body := req.Body
	if req.Template != "" {
		rendered, err := h.engine.RenderBySlug(r.Context(), req.Template, req.Data, "")
		if err == nil {
			if rendered.Subject != "" {
				subject = rendered.Subject
			}
			if rendered.Body != "" {
				body = rendered.Body
			}
		}
	}

	priority := req.Priority
	if priority == "" {
		priority = "normal"
	}

	var notificationID string
	err = h.db.Pool.QueryRow(r.Context(),
		`INSERT INTO notify.notifications (user_id, app_id, channel, template_id, subject, body, data, priority, recipient, external_id, scheduled_for)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		 RETURNING id`,
		nilIfEmpty(req.UserID), req.AppID, req.Channel, nilIfEmpty(req.Template),
		nilIfEmpty(subject), nilIfEmpty(body), jsonOrNil(req.Data),
		priority, nilIfEmpty(req.Recipient), nilIfEmpty(req.ExternalID), scheduledFor,
	).Scan(&notificationID)
	if err != nil {
		httputil.WriteError(w, http.StatusInternalServerError, "failed to create notification")
		return
	}

	job := queue.Job{
		NotificationID: notificationID,
		Channel:        req.Channel,
		AppID:          req.AppID,
		Recipient:      req.Recipient,
		Subject:        subject,
		Body:           body,
		Data:           req.Data,
		ScheduleAt:     &scheduledFor,
	}
	h.pool.Enqueue(job)

	httputil.WriteJSON(w, http.StatusAccepted, map[string]any{
		"notification": map[string]any{
			"id":           notificationID,
			"status":       "pending",
			"scheduledFor": scheduledFor.Format(time.RFC3339),
		},
	})
}

// Batch handles POST /api/v1/notifications/batch
func (h *NotificationsHandler) Batch(w http.ResponseWriter, r *http.Request) {
	var req BatchRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 5<<20)).Decode(&req); err != nil {
		httputil.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if len(req.Notifications) == 0 {
		httputil.WriteError(w, http.StatusBadRequest, "notifications array is required")
		return
	}
	if len(req.Notifications) > 100 {
		httputil.WriteError(w, http.StatusBadRequest, "maximum 100 notifications per batch")
		return
	}

	type batchResult struct {
		ID     string `json:"id,omitempty"`
		Status string `json:"status"`
		Error  string `json:"error,omitempty"`
	}

	results := make([]batchResult, len(req.Notifications))
	succeeded := 0
	failed := 0

	for i, n := range req.Notifications {
		if err := validateSendRequest(&n); err != nil {
			results[i] = batchResult{Status: "failed", Error: err.Error()}
			failed++
			continue
		}

		subject := n.Subject
		body := n.Body
		if n.Template != "" {
			rendered, err := h.engine.RenderBySlug(r.Context(), n.Template, n.Data, "")
			if err == nil {
				if rendered.Subject != "" {
					subject = rendered.Subject
				}
				if rendered.Body != "" {
					body = rendered.Body
				}
			}
		}

		priority := n.Priority
		if priority == "" {
			priority = "normal"
		}

		var notificationID string
		err := h.db.Pool.QueryRow(r.Context(),
			`INSERT INTO notify.notifications (user_id, app_id, channel, subject, body, data, priority, recipient)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			 RETURNING id`,
			nilIfEmpty(n.UserID), n.AppID, n.Channel,
			nilIfEmpty(subject), nilIfEmpty(body), jsonOrNil(n.Data), priority, nilIfEmpty(n.Recipient),
		).Scan(&notificationID)
		if err != nil {
			results[i] = batchResult{Status: "failed", Error: "database error"}
			failed++
			continue
		}

		h.pool.Enqueue(queue.Job{
			NotificationID: notificationID,
			Channel:        n.Channel,
			AppID:          n.AppID,
			Recipient:      n.Recipient,
			Subject:        subject,
			Body:           body,
			Data:           n.Data,
		})

		results[i] = batchResult{ID: notificationID, Status: "pending"}
		succeeded++
	}

	httputil.WriteJSON(w, http.StatusAccepted, map[string]any{
		"results":   results,
		"succeeded": succeeded,
		"failed":    failed,
	})
}

// GetNotification handles GET /api/v1/notifications/{id}
func (h *NotificationsHandler) GetNotification(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httputil.WriteError(w, http.StatusBadRequest, "notification id required")
		return
	}

	var n db.Notification
	err := h.db.Pool.QueryRow(r.Context(),
		`SELECT id, user_id, app_id, channel, template_id, subject, body, status, priority, scheduled_for, recipient, external_id, attempts, delivered_at, error_message, created_at, updated_at
		 FROM notify.notifications WHERE id = $1`, id,
	).Scan(&n.ID, &n.UserID, &n.AppID, &n.Channel, &n.TemplateID, &n.Subject, &n.Body,
		&n.Status, &n.Priority, &n.ScheduledFor, &n.Recipient, &n.ExternalID,
		&n.Attempts, &n.DeliveredAt, &n.ErrorMessage, &n.CreatedAt, &n.UpdatedAt)

	if err != nil {
		httputil.WriteError(w, http.StatusNotFound, "notification not found")
		return
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{"notification": n})
}

// CancelNotification handles DELETE /api/v1/notifications/{id}
func (h *NotificationsHandler) CancelNotification(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httputil.WriteError(w, http.StatusBadRequest, "notification id required")
		return
	}

	result, err := h.db.Pool.Exec(r.Context(),
		`UPDATE notify.notifications SET status = 'cancelled', updated_at = NOW() WHERE id = $1 AND status = 'pending'`, id)
	if err != nil {
		httputil.WriteError(w, http.StatusInternalServerError, "failed to cancel notification")
		return
	}
	if result.RowsAffected() == 0 {
		httputil.WriteError(w, http.StatusNotFound, "notification not found or already processed")
		return
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{"cancelled": true})
}

func (h *NotificationsHandler) checkPreferences(ctx context.Context, userID, ch string) (bool, string) {
	var emailEnabled, pushEnabled, quietEnabled bool
	var quietStart, quietEnd, timezone *string

	err := h.db.Pool.QueryRow(ctx,
		`SELECT email_enabled, push_enabled, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, timezone
		 FROM notify.preferences WHERE user_id = $1`, userID,
	).Scan(&emailEnabled, &pushEnabled, &quietEnabled, &quietStart, &quietEnd, &timezone)

	if err != nil {
		return false, "" // No preferences = allow
	}

	// Check channel preferences
	if ch == "email" && !emailEnabled {
		return true, "email notifications disabled by user"
	}
	if ch == "push" && !pushEnabled {
		return true, "push notifications disabled by user"
	}

	// Check quiet hours
	if quietEnabled && quietStart != nil && quietEnd != nil {
		tz := "Europe/Berlin"
		if timezone != nil {
			tz = *timezone
		}
		loc, err := time.LoadLocation(tz)
		if err == nil {
			now := time.Now().In(loc)
			nowMinutes := now.Hour()*60 + now.Minute()

			startH, startM := parseTime(*quietStart)
			endH, endM := parseTime(*quietEnd)
			startMinutes := startH*60 + startM
			endMinutes := endH*60 + endM

			var inQuiet bool
			if startMinutes <= endMinutes {
				inQuiet = nowMinutes >= startMinutes && nowMinutes < endMinutes
			} else {
				// Spans midnight (e.g. 22:00 to 08:00)
				inQuiet = nowMinutes >= startMinutes || nowMinutes < endMinutes
			}

			if inQuiet {
				return true, "quiet hours active"
			}
		}
	}

	return false, ""
}

func validateSendRequest(req *SendRequest) error {
	if req.Channel == "" {
		return fmt.Errorf("channel is required")
	}
	validChannels := map[string]bool{"email": true, "push": true, "matrix": true, "webhook": true}
	if !validChannels[req.Channel] {
		return fmt.Errorf("channel must be email, push, matrix, or webhook")
	}
	if req.AppID == "" {
		return fmt.Errorf("appId is required")
	}
	if req.Recipient == "" && len(req.Recipients) == 0 && req.UserID == "" {
		return fmt.Errorf("recipient, recipients, or userId is required")
	}
	if req.Template == "" && req.Body == "" {
		return fmt.Errorf("template or body is required")
	}
	return nil
}

func parseTime(s string) (int, int) {
	var h, m int
	fmt.Sscanf(s, "%d:%d", &h, &m)
	return h, m
}

func nilIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func jsonOrNil(data map[string]any) []byte {
	if data == nil {
		return nil
	}
	b, err := json.Marshal(data)
	if err != nil {
		return nil
	}
	return b
}
