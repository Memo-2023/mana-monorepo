package queue

import (
	"context"
	"fmt"
	"log/slog"
	"math"
	"time"

	"github.com/manacore/mana-notify/internal/channel"
	"github.com/manacore/mana-notify/internal/db"
	"github.com/manacore/mana-notify/internal/metrics"
)

// Job represents a notification delivery job.
type Job struct {
	NotificationID string
	Channel        string
	AppID          string
	Recipient      string
	Subject        string
	Body           string
	Data           map[string]any

	// Channel-specific
	From          string
	ReplyTo       string
	Tokens        []string           // Push: multiple tokens
	Sound         string             // Push
	Badge         *int               // Push
	Platform      string             // Push
	RoomID        string             // Matrix
	FormattedBody string             // Matrix
	MsgType       string             // Matrix
	WebhookMethod string             // Webhook
	WebhookHeaders map[string]string // Webhook
	WebhookTimeout int               // Webhook

	// Retry
	Attempt    int
	MaxRetries int
	BackoffMs  int
	ScheduleAt *time.Time
}

// WorkerConfig per channel.
type WorkerConfig struct {
	Concurrency int
	MaxRetries  int
	BackoffMs   int
}

var DefaultConfigs = map[string]WorkerConfig{
	"email":   {Concurrency: 5, MaxRetries: 3, BackoffMs: 5000},
	"push":    {Concurrency: 10, MaxRetries: 3, BackoffMs: 1000},
	"matrix":  {Concurrency: 5, MaxRetries: 3, BackoffMs: 2000},
	"webhook": {Concurrency: 10, MaxRetries: 5, BackoffMs: 3000},
}

// WorkerPool manages goroutine-based workers for all channels.
type WorkerPool struct {
	db      *db.DB
	email   *channel.EmailService
	push    *channel.PushService
	matrix  *channel.MatrixService
	webhook *channel.WebhookService
	metrics *metrics.Metrics
	jobs    chan Job
	ctx     context.Context
	cancel  context.CancelFunc
}

func NewWorkerPool(database *db.DB, email *channel.EmailService, push *channel.PushService, matrix *channel.MatrixService, webhook *channel.WebhookService, m *metrics.Metrics) *WorkerPool {
	ctx, cancel := context.WithCancel(context.Background())
	return &WorkerPool{
		db:      database,
		email:   email,
		push:    push,
		matrix:  matrix,
		webhook: webhook,
		metrics: m,
		jobs:    make(chan Job, 1000),
		ctx:     ctx,
		cancel:  cancel,
	}
}

func (wp *WorkerPool) Start() {
	// Start workers per channel type
	for ch, cfg := range DefaultConfigs {
		for i := 0; i < cfg.Concurrency; i++ {
			go wp.worker(ch)
		}
		slog.Info("workers started", "channel", ch, "concurrency", cfg.Concurrency)
	}
}

func (wp *WorkerPool) Stop() {
	wp.cancel()
	close(wp.jobs)
}

// Enqueue adds a job to the worker pool.
func (wp *WorkerPool) Enqueue(job Job) {
	cfg := DefaultConfigs[job.Channel]
	if job.MaxRetries == 0 {
		job.MaxRetries = cfg.MaxRetries
	}
	if job.BackoffMs == 0 {
		job.BackoffMs = cfg.BackoffMs
	}

	// Handle scheduled delivery
	if job.ScheduleAt != nil && job.ScheduleAt.After(time.Now()) {
		delay := time.Until(*job.ScheduleAt)
		go func() {
			timer := time.NewTimer(delay)
			defer timer.Stop()
			select {
			case <-timer.C:
				wp.jobs <- job
			case <-wp.ctx.Done():
			}
		}()
		return
	}

	wp.jobs <- job
}

func (wp *WorkerPool) worker(ch string) {
	for {
		select {
		case job, ok := <-wp.jobs:
			if !ok {
				return
			}
			if job.Channel != ch {
				// Put back for correct channel worker
				wp.jobs <- job
				continue
			}
			wp.processJob(job)
		case <-wp.ctx.Done():
			return
		}
	}
}

func (wp *WorkerPool) processJob(job Job) {
	start := time.Now()
	ctx := wp.ctx

	// Update status to processing
	wp.updateStatus(ctx, job.NotificationID, "processing", job.Attempt+1, nil)

	var success bool
	var providerID string
	var statusCode *int
	var errMsg string

	defer func() {
		if r := recover(); r != nil {
			slog.Error("job panic", "notification", job.NotificationID, "panic", r)
			errMsg = "internal panic"
			success = false
		}

		duration := time.Since(start)
		durationMs := int(duration.Milliseconds())

		// Log delivery attempt
		wp.logDelivery(ctx, job.NotificationID, job.Attempt+1, job.Channel, success, statusCode, errMsg, providerID, durationMs)

		if success {
			wp.updateStatus(ctx, job.NotificationID, "delivered", job.Attempt+1, nil)
			wp.metrics.NotificationsSent.WithLabelValues(job.Channel, job.AppID).Inc()
		} else if job.Attempt+1 < job.MaxRetries {
			// Retry with exponential backoff
			job.Attempt++
			delay := time.Duration(float64(job.BackoffMs)*math.Pow(2, float64(job.Attempt-1))) * time.Millisecond
			go func() {
				timer := time.NewTimer(delay)
				defer timer.Stop()
				select {
				case <-timer.C:
					wp.jobs <- job
				case <-wp.ctx.Done():
				}
			}()
			slog.Info("retrying job", "notification", job.NotificationID, "attempt", job.Attempt, "delay", delay)
		} else {
			errStr := errMsg
			wp.updateStatus(ctx, job.NotificationID, "failed", job.Attempt+1, &errStr)
			wp.metrics.NotificationsFailed.WithLabelValues(job.Channel, job.AppID, "max_retries").Inc()
		}

		wp.metrics.NotificationLatency.WithLabelValues(job.Channel).Observe(duration.Seconds())
	}()

	switch job.Channel {
	case "email":
		result := wp.email.Send(&channel.EmailMessage{
			To:      job.Recipient,
			Subject: job.Subject,
			HTML:    job.Body,
			From:    job.From,
			ReplyTo: job.ReplyTo,
		})
		success = result.Success
		providerID = result.MessageID
		errMsg = result.Error
		template := "custom"
		status := "success"
		if !success {
			status = "failed"
		}
		wp.metrics.EmailsSent.WithLabelValues(template, status).Inc()
		wp.metrics.EmailLatency.Observe(time.Since(start).Seconds())

	case "push":
		tokens := job.Tokens
		if len(tokens) == 0 && job.Recipient != "" {
			tokens = []string{job.Recipient}
		}
		results := wp.push.SendToTokens(ctx, tokens, job.Subject, job.Body, job.Data, job.Sound, job.Badge)
		// Check if all succeeded
		success = true
		for _, r := range results {
			if !r.Success {
				success = false
				errMsg = r.Error
			} else {
				providerID = r.TicketID
			}
		}
		status := "success"
		if !success {
			status = "failed"
		}
		wp.metrics.PushSent.WithLabelValues(job.Platform, status).Inc()
		wp.metrics.PushLatency.Observe(time.Since(start).Seconds())

	case "matrix":
		result := wp.matrix.Send(ctx, &channel.MatrixMessage{
			RoomID:        job.RoomID,
			Body:          job.Body,
			FormattedBody: job.FormattedBody,
			MsgType:       job.MsgType,
		})
		success = result.Success
		providerID = result.EventID
		errMsg = result.Error
		status := "success"
		if !success {
			status = "failed"
		}
		wp.metrics.MatrixSent.WithLabelValues(status).Inc()

	case "webhook":
		result := wp.webhook.Send(ctx, &channel.WebhookMessage{
			URL:     job.Recipient,
			Method:  job.WebhookMethod,
			Headers: job.WebhookHeaders,
			Body:    job.Data,
			Timeout: job.WebhookTimeout,
		})
		success = result.Success
		sc := result.StatusCode
		statusCode = &sc
		errMsg = result.Error
		status := "success"
		if !success {
			status = "failed"
		}
		wp.metrics.WebhooksSent.WithLabelValues(status).Inc()
	}
}

func (wp *WorkerPool) updateStatus(ctx context.Context, notificationID, status string, attempts int, errMsg *string) {
	query := `UPDATE notify.notifications SET status = $1, attempts = $2, updated_at = NOW()`
	args := []any{status, attempts}

	if status == "delivered" {
		query += `, delivered_at = NOW()`
	}
	if errMsg != nil {
		query += fmt.Sprintf(`, error_message = $%d`, len(args)+1)
		args = append(args, *errMsg)
	}

	query += fmt.Sprintf(` WHERE id = $%d`, len(args)+1)
	args = append(args, notificationID)

	if _, err := wp.db.Pool.Exec(ctx, query, args...); err != nil {
		slog.Error("update notification status failed", "id", notificationID, "error", err)
	}
}

func (wp *WorkerPool) logDelivery(ctx context.Context, notificationID string, attempt int, ch string, success bool, statusCode *int, errMsg, providerID string, durationMs int) {
	var errMsgPtr, providerIDPtr *string
	if errMsg != "" {
		errMsgPtr = &errMsg
	}
	if providerID != "" {
		providerIDPtr = &providerID
	}

	_, err := wp.db.Pool.Exec(ctx,
		`INSERT INTO notify.delivery_logs (notification_id, attempt_number, channel, success, status_code, error_message, provider_id, duration_ms)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		notificationID, attempt, ch, success, statusCode, errMsgPtr, providerIDPtr, durationMs,
	)
	if err != nil {
		slog.Error("log delivery failed", "notification", notificationID, "error", err)
	}
}

