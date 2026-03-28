package httputil

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestWriteJSON(t *testing.T) {
	w := httptest.NewRecorder()
	WriteJSON(w, http.StatusOK, map[string]string{"key": "value"})

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
	if ct := w.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("expected application/json, got %s", ct)
	}
	if !strings.Contains(w.Body.String(), `"key":"value"`) {
		t.Errorf("unexpected body: %s", w.Body.String())
	}
}

func TestWriteError(t *testing.T) {
	w := httptest.NewRecorder()
	WriteError(w, http.StatusBadRequest, "test error")

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
	body := w.Body.String()
	if !strings.Contains(body, `"message":"test error"`) {
		t.Errorf("unexpected body: %s", body)
	}
	if !strings.Contains(body, `"success":false`) {
		t.Errorf("missing success:false in body: %s", body)
	}
}

func TestDecodeJSON(t *testing.T) {
	var dst struct {
		Name string `json:"name"`
	}

	r := httptest.NewRequest("POST", "/", strings.NewReader(`{"name":"test"}`))
	w := httptest.NewRecorder()

	if !DecodeJSON(w, r, &dst, 1<<20) {
		t.Error("expected decode to succeed")
	}
	if dst.Name != "test" {
		t.Errorf("expected 'test', got '%s'", dst.Name)
	}
}

func TestDecodeJSON_Invalid(t *testing.T) {
	var dst struct{}
	r := httptest.NewRequest("POST", "/", strings.NewReader(`invalid`))
	w := httptest.NewRecorder()

	if DecodeJSON(w, r, &dst, 1<<20) {
		t.Error("expected decode to fail")
	}
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}
