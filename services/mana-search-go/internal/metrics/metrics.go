package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

type Metrics struct {
	Requests       *prometheus.CounterVec
	Latency        *prometheus.HistogramVec
	CacheHits      prometheus.Counter
	CacheMisses    prometheus.Counter
	EngineStatus   *prometheus.GaugeVec
	ActiveSearches prometheus.Gauge
}

func New() *Metrics {
	return &Metrics{
		Requests: promauto.NewCounterVec(prometheus.CounterOpts{
			Name: "mana_search_requests_total",
			Help: "Total number of requests",
		}, []string{"endpoint", "status"}),

		Latency: promauto.NewHistogramVec(prometheus.HistogramOpts{
			Name:    "mana_search_latency_seconds",
			Help:    "Request latency in seconds",
			Buckets: []float64{0.1, 0.25, 0.5, 1, 2, 5, 10},
		}, []string{"endpoint"}),

		CacheHits: promauto.NewCounter(prometheus.CounterOpts{
			Name: "mana_search_cache_hits_total",
			Help: "Total cache hits",
		}),

		CacheMisses: promauto.NewCounter(prometheus.CounterOpts{
			Name: "mana_search_cache_misses_total",
			Help: "Total cache misses",
		}),

		EngineStatus: promauto.NewGaugeVec(prometheus.GaugeOpts{
			Name: "mana_search_engine_status",
			Help: "Search engine status (1=ok, 0=error)",
		}, []string{"engine"}),

		ActiveSearches: promauto.NewGauge(prometheus.GaugeOpts{
			Name: "mana_search_active_searches",
			Help: "Number of active search requests",
		}),
	}
}

func (m *Metrics) RecordRequest(endpoint string, status string, durationSeconds float64) {
	m.Requests.WithLabelValues(endpoint, status).Inc()
	m.Latency.WithLabelValues(endpoint).Observe(durationSeconds)
}
