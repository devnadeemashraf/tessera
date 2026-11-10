// SPDX-License-Identifier: AGPL-3.0-only
package main

import (
	"fmt"
	"net/http"
	"os"

	"tessera.local/tessera/server/httpapi"
)

func run(port string, serve func(*http.Server) error) error {
	if port == "" {
		port = "8080"
	}
	server, err := httpapi.NewServer(port)
	if err != nil {
		return err
	}
	return serve(server)
}

func main() {
	if err := run(os.Getenv("PORT"), (*http.Server).ListenAndServe); err != nil {
		// Do not print raw system errors, addresses or configuration values.
		fmt.Fprintln(os.Stderr, "server_start_failed")
		os.Exit(1)
	}
}
