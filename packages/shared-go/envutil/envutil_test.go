package envutil

import (
	"os"
	"testing"
)

func TestGet(t *testing.T) {
	os.Setenv("TEST_GET_VAR", "hello")
	defer os.Unsetenv("TEST_GET_VAR")

	if v := Get("TEST_GET_VAR", "default"); v != "hello" {
		t.Errorf("expected 'hello', got '%s'", v)
	}
	if v := Get("TEST_GET_MISSING", "default"); v != "default" {
		t.Errorf("expected 'default', got '%s'", v)
	}
}

func TestGetInt(t *testing.T) {
	os.Setenv("TEST_INT_VAR", "42")
	defer os.Unsetenv("TEST_INT_VAR")

	if v := GetInt("TEST_INT_VAR", 0); v != 42 {
		t.Errorf("expected 42, got %d", v)
	}
	if v := GetInt("TEST_INT_MISSING", 99); v != 99 {
		t.Errorf("expected 99, got %d", v)
	}

	os.Setenv("TEST_INT_INVALID", "abc")
	defer os.Unsetenv("TEST_INT_INVALID")
	if v := GetInt("TEST_INT_INVALID", 7); v != 7 {
		t.Errorf("expected fallback 7 for invalid, got %d", v)
	}
}

func TestGetBool(t *testing.T) {
	os.Setenv("TEST_BOOL_VAR", "true")
	defer os.Unsetenv("TEST_BOOL_VAR")

	if v := GetBool("TEST_BOOL_VAR", false); !v {
		t.Error("expected true")
	}
	if v := GetBool("TEST_BOOL_MISSING", true); !v {
		t.Error("expected default true")
	}
}

func TestGetSlice(t *testing.T) {
	os.Setenv("TEST_SLICE_VAR", "a,b,c")
	defer os.Unsetenv("TEST_SLICE_VAR")

	v := GetSlice("TEST_SLICE_VAR", nil)
	if len(v) != 3 || v[0] != "a" || v[2] != "c" {
		t.Errorf("expected [a,b,c], got %v", v)
	}

	v = GetSlice("TEST_SLICE_MISSING", []string{"x"})
	if len(v) != 1 || v[0] != "x" {
		t.Errorf("expected [x], got %v", v)
	}
}
