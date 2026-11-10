# Architecture overview

The Go core owns vault cryptography, storage, matching, merge and backup.
React/TypeScript UI calls narrow Go/native bridges through Capacitor and Wails.
Native adapters provide OS key protection, verification and mobile autofill.
Desktop browser extensions ask the native app for consent-bound fills.
The stateless Go API stores ciphertext and minimal service metadata in Neon Postgres.
Render hosts that API; Cloudflare Pages hosts the static marketing/download site.
Google authenticates cloud identity, never vault decryption.
One approved merchant of record supplies checkout and subscription events.
Local vault access remains independent of all hosted services.

# Decisions
