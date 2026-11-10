// SPDX-License-Identifier: AGPL-3.0-only
package httpapi

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"reflect"
	"testing"
	"time"
)

func TestHealthContract(t *testing.T) {
	rr := httptest.NewRecorder()
	Handler().ServeHTTP(rr, httptest.NewRequest(http.MethodGet, "/healthz", nil))
	if rr.Code != http.StatusOK || rr.Body.String() != "{\"status\":\"ok\"}\n" {
		t.Fatalf("unexpected health: %d %s", rr.Code, rr.Body.String())
	}
	for key, want := range map[string]string{"Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"} {
		if rr.Header().Get(key) != want {
			t.Errorf("%s mismatch", key)
		}
	}
	data, err := os.ReadFile("../../contracts/health.schema.json")
	if err != nil {
		t.Fatal(err)
	}
	var schema struct {
		Properties           map[string]struct{ Const string }
		Required             []string
		AdditionalProperties bool
	}
	if err := json.Unmarshal(data, &schema); err != nil {
		t.Fatal(err)
	}
	if len(schema.Properties) != 1 || schema.Properties["status"].Const != "ok" || !reflect.DeepEqual(schema.Required, []string{"status"}) || schema.AdditionalProperties {
		t.Fatal("contract drift")
	}
}

func TestRejectedRoutes(t *testing.T) {
	for _, tc := range []struct {
		method, path string
		status       int
	}{{"POST", "/healthz", 405}, {"GET", "/missing", 404}, {"GET", "/healthz/extra", 404}, {"HEAD", "/healthz", 200}} {
		rr := httptest.NewRecorder()
		Handler().ServeHTTP(rr, httptest.NewRequest(tc.method, tc.path, nil))
		if rr.Code != tc.status {
			t.Errorf("%s %s: %d", tc.method, tc.path, rr.Code)
		}
		if tc.method == "HEAD" && rr.Body.Len() != 0 {
			t.Fatal("HEAD has body")
		}
	}
}

func TestServerConfiguration(t *testing.T) {
	for _, port := range []string{"", "0", "65536", "abc", "-1", "8080:bad", " 8080"} {
		if _, err := NewServer(port); err == nil {
			t.Errorf("accepted invalid port %q", port)
		}
	}
	s, err := NewServer("8080")
	if err != nil {
		t.Fatal(err)
	}
	if s.Addr != ":8080" || s.ReadHeaderTimeout != 5*time.Second || s.ReadTimeout != 10*time.Second || s.WriteTimeout != 10*time.Second || s.IdleTimeout != 60*time.Second || s.MaxHeaderBytes != 16<<10 {
		t.Fatal("unsafe server configuration")
	}
}
