package proxy

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"github.com/mana/mana-api-gateway/internal/middleware"
	"github.com/mana/mana-api-gateway/internal/service"
)

// ServiceProxy proxies requests to backend services and tracks usage.
type ServiceProxy struct {
	searchProxy *httputil.ReverseProxy
	sttProxy    *httputil.ReverseProxy
	ttsProxy    *httputil.ReverseProxy

	apiKeyService *service.ApiKeyService
	usageService  *service.UsageService
}

// NewServiceProxy creates a new service proxy.
func NewServiceProxy(searchURL, sttURL, ttsURL string, apiKeySvc *service.ApiKeyService, usageSvc *service.UsageService) *ServiceProxy {
	return &ServiceProxy{
		searchProxy:   createProxy(searchURL),
		sttProxy:      createProxy(sttURL),
		ttsProxy:      createProxy(ttsURL),
		apiKeyService: apiKeySvc,
		usageService:  usageSvc,
	}
}

func createProxy(targetURL string) *httputil.ReverseProxy {
	target, err := url.Parse(targetURL)
	if err != nil {
		slog.Error("invalid proxy target", "url", targetURL, "error", err)
		return nil
	}

	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.Transport = &http.Transport{
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 20,
		IdleConnTimeout:     90 * time.Second,
	}

	return proxy
}

// HandleSearch proxies to the search service.
func (p *ServiceProxy) HandleSearch(w http.ResponseWriter, r *http.Request) {
	p.proxyRequest(w, r, p.searchProxy, "search", "/api/v1")
}

// HandleSTT proxies to the STT service.
func (p *ServiceProxy) HandleSTT(w http.ResponseWriter, r *http.Request) {
	p.proxyRequest(w, r, p.sttProxy, "stt", "")
}

// HandleTTS proxies to the TTS service.
func (p *ServiceProxy) HandleTTS(w http.ResponseWriter, r *http.Request) {
	p.proxyRequest(w, r, p.ttsProxy, "tts", "")
}

func (p *ServiceProxy) proxyRequest(w http.ResponseWriter, r *http.Request, proxy *httputil.ReverseProxy, endpoint, pathPrefix string) {
	if proxy == nil {
		http.Error(w, `{"error":"service unavailable"}`, http.StatusServiceUnavailable)
		return
	}

	keyData := middleware.GetApiKey(r)
	start := time.Now()

	// Rewrite path: /v1/search -> /api/v1/search (or whatever the backend expects)
	originalPath := r.URL.Path
	if pathPrefix != "" {
		r.URL.Path = strings.Replace(r.URL.Path, "/v1/"+endpoint, pathPrefix+"/"+endpoint, 1)
	}

	// Use a response recorder to capture status code
	rec := &responseRecorder{ResponseWriter: w, statusCode: 200}

	proxy.ServeHTTP(rec, r)

	// Log usage
	latency := time.Since(start).Milliseconds()
	credits := service.CreditCosts[endpoint]
	if credits == 0 {
		credits = 1
	}

	// Deduct credits
	if keyData != nil {
		p.apiKeyService.IncrementCredits(r.Context(), keyData.ID, credits)

		// Log usage asynchronously
		go func() {
			p.usageService.LogUsage(r.Context(), service.UsageEntry{
				ApiKeyID:     keyData.ID,
				Endpoint:     endpoint,
				Method:       r.Method,
				Path:         originalPath,
				RequestSize:  int(r.ContentLength),
				ResponseSize: rec.size,
				LatencyMs:    int(latency),
				StatusCode:   rec.statusCode,
				CreditsUsed:  credits,
				CreditReason: endpoint,
			})
		}()
	}
}

// responseRecorder captures the status code and response size.
type responseRecorder struct {
	http.ResponseWriter
	statusCode int
	size       int
}

func (r *responseRecorder) WriteHeader(code int) {
	r.statusCode = code
	r.ResponseWriter.WriteHeader(code)
}

func (r *responseRecorder) Write(b []byte) (int, error) {
	n, err := r.ResponseWriter.Write(b)
	r.size += n
	return n, err
}

// Flush implements http.Flusher for streaming responses.
func (r *responseRecorder) Flush() {
	if f, ok := r.ResponseWriter.(http.Flusher); ok {
		f.Flush()
	}
}

// Unwrap returns the underlying ResponseWriter (for http.ResponseController).
func (r *responseRecorder) Unwrap() http.ResponseWriter {
	return r.ResponseWriter
}

// ReadFrom implements io.ReaderFrom for efficient copying.
func (r *responseRecorder) ReadFrom(src io.Reader) (int64, error) {
	if rf, ok := r.ResponseWriter.(io.ReaderFrom); ok {
		n, err := rf.ReadFrom(src)
		r.size += int(n)
		return n, err
	}
	// Fallback: use io.Copy which will call Write
	return io.Copy(r.ResponseWriter, src)
}
