package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

type Metrics struct {
	NotificationsSent   *prometheus.CounterVec
	NotificationsFailed *prometheus.CounterVec
	EmailsSent          *prometheus.CounterVec
	PushSent            *prometheus.CounterVec
	MatrixSent          *prometheus.CounterVec
	WebhooksSent        *prometheus.CounterVec
	NotificationLatency *prometheus.HistogramVec
	EmailLatency        prometheus.Histogram
	PushLatency         prometheus.Histogram
}

func New() *Metrics {
	return &Metrics{
		NotificationsSent: promauto.NewCounterVec(prometheus.CounterOpts{
			Name: "mana_notify_notifications_sent_total",
			Help: "Total notifications sent",
		}, []string{"channel", "app_id"}),

		NotificationsFailed: promauto.NewCounterVec(prometheus.CounterOpts{
			Name: "mana_notify_notifications_failed_total",
			Help: "Total notifications failed",
		}, []string{"channel", "app_id", "error_type"}),

		EmailsSent: promauto.NewCounterVec(prometheus.CounterOpts{
			Name: "mana_notify_emails_sent_total",
			Help: "Total emails sent",
		}, []string{"template", "status"}),

		PushSent: promauto.NewCounterVec(prometheus.CounterOpts{
			Name: "mana_notify_push_sent_total",
			Help: "Total push notifications sent",
		}, []string{"platform", "status"}),

		MatrixSent: promauto.NewCounterVec(prometheus.CounterOpts{
			Name: "mana_notify_matrix_sent_total",
			Help: "Total Matrix messages sent",
		}, []string{"status"}),

		WebhooksSent: promauto.NewCounterVec(prometheus.CounterOpts{
			Name: "mana_notify_webhooks_sent_total",
			Help: "Total webhooks sent",
		}, []string{"status"}),

		NotificationLatency: promauto.NewHistogramVec(prometheus.HistogramOpts{
			Name:    "mana_notify_notification_latency_seconds",
			Help:    "Notification processing latency",
			Buckets: []float64{0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10},
		}, []string{"channel"}),

		EmailLatency: promauto.NewHistogram(prometheus.HistogramOpts{
			Name:    "mana_notify_email_latency_seconds",
			Help:    "Email sending latency",
			Buckets: []float64{0.1, 0.5, 1, 2, 5, 10},
		}),

		PushLatency: promauto.NewHistogram(prometheus.HistogramOpts{
			Name:    "mana_notify_push_latency_seconds",
			Help:    "Push notification latency",
			Buckets: []float64{0.01, 0.05, 0.1, 0.5, 1},
		}),
	}
}
