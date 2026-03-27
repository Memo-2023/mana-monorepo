package service

import (
	"testing"
	"time"
)

func TestGenerateKey(t *testing.T) {
	svc := &ApiKeyService{prefixLive: "sk_live_", prefixTest: "sk_test_"}

	key, hash, prefix := svc.GenerateKey(false)
	if prefix != "sk_live_" {
		t.Errorf("expected sk_live_ prefix, got %s", prefix)
	}
	if len(key) < 20 {
		t.Errorf("key too short: %s", key)
	}
	if len(hash) != 64 { // SHA256 hex
		t.Errorf("hash wrong length: %d", len(hash))
	}

	// Test key
	key2, _, prefix2 := svc.GenerateKey(true)
	if prefix2 != "sk_test_" {
		t.Errorf("expected sk_test_ prefix, got %s", prefix2)
	}
	if key == key2 {
		t.Error("keys should be unique")
	}
}

func TestMaskKey(t *testing.T) {
	svc := &ApiKeyService{prefixLive: "sk_live_", prefixTest: "sk_test_"}

	tests := []struct {
		key  string
		want string
	}{
		{"sk_live_abcdefghijklmnop1234", "sk_live_...1234"},
		{"sk_test_xyz9876543210abcdef", "sk_test_...cdef"},
		{"short", "short"},
	}

	for _, tt := range tests {
		got := svc.MaskKey(tt.key)
		if got != tt.want {
			t.Errorf("MaskKey(%q) = %q, want %q", tt.key, got, tt.want)
		}
	}
}

func TestNextMonthReset(t *testing.T) {
	reset := nextMonthReset()
	now := time.Now()

	if reset.Before(now) {
		t.Error("reset should be in the future")
	}
	if reset.Day() != 1 {
		t.Errorf("reset should be first of month, got day %d", reset.Day())
	}
}

func TestPricingTiers(t *testing.T) {
	free := Tiers["free"]
	if free.RateLimit != 10 {
		t.Errorf("free rate limit = %d, want 10", free.RateLimit)
	}
	if free.MonthlyCredits != 100 {
		t.Errorf("free monthly credits = %d, want 100", free.MonthlyCredits)
	}

	pro := Tiers["pro"]
	if pro.RateLimit != 100 {
		t.Errorf("pro rate limit = %d, want 100", pro.RateLimit)
	}

	enterprise := Tiers["enterprise"]
	if enterprise.RateLimit != 1000 {
		t.Errorf("enterprise rate limit = %d, want 1000", enterprise.RateLimit)
	}
}
