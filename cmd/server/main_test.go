// SPDX-License-Identifier: AGPL-3.0-only
package main

import (
	"errors"
	"net/http"
	"testing"
)

func TestRun(t *testing.T) {
	for _, tc := range []struct{ port, addr string }{{"", ":8080"}, {"9000", ":9000"}} {
		called := false
		err := run(tc.port, func(s *http.Server) error {
			called = true
			if s.Addr != tc.addr {
				t.Errorf("wrong address")
			}
			return nil
		})
		if err != nil || !called {
			t.Fatal("listener was not called")
		}
	}
	if err := run("bad", func(_ *http.Server) error { t.Fatal("invalid config reached listener"); return nil }); err == nil {
		t.Fatal("invalid config accepted")
	}
	want := errors.New("synthetic listener failure")
	if err := run("8080", func(_ *http.Server) error { return want }); !errors.Is(err, want) {
		t.Fatal("listener failure not propagated")
	}
}
