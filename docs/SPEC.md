# Tessera — canonical product specification

## 1. Authority and purpose

Keep your word. Quiet until it matters.
Build a local-first, open-source password manager for individuals, with an optional sustainable cloud subscription. BUILD mode; Windows development; India-based seller serving global customers.
This specification incorporates the owner's approved changes to `TESSERA_SPEC.md`. That file and `PROJECT_SCAFFOLD.md` remain unchanged historical inputs. This specification governs product behavior; the scaffold governs development workflow. Changes require owner approval.
MVP means qualified Android and Windows releases, browser integration, local vaults, optional E2EE cloud sync, recovery, and a working cancel-anytime subscription. Phase 0 is not the MVP.

## 2. Principles and trust boundaries

- MUST: accountless local operation; an explicitly offline mode makes zero network requests, including telemetry, updates, icons and sign-in.
- MUST: assume cloud storage is hostile. Encrypt vault contents, titles, URLs and history on the device. Necessary account, device, billing, sequence and operational metadata remain visible; do not claim otherwise.
- MUST: one shared Go security core. React/TypeScript UI through Capacitor on mobile and Wails on desktop; thin TypeScript browser extensions communicate with the desktop app.
- MUST: keys remain in Go/native adapters, never browser storage or frontend state. Authorized display and filling temporarily expose selected plaintext. No remote executable UI or JavaScript OTA updates.
- MUST: every fill requires a fresh native user-verification gesture naming the item and destination. Security, backup and exit/export capabilities are free.
- MUST: no ads, data sales, affiliate tracking or third-party analytics SDKs. No claim of perfect anonymity, complete memory zeroization, audited security or coverage of every historical breach.

## 3. Delivery and features

- MUST for MVP: logins, secure notes, TOTP, password generation, search, edit, password history (20 versions), trash (30 days), encrypted backup/restore, import/export, backup health, native unlock, per-fill consent, Google account sign-in, device management and offline cloud sync.
- MUST: scheduled encrypted local backups to an owner-selected folder; warn after 30 days without a successful backup; disable OS cloud backup of vault app data. Preserve hardware-key isolation.
- MUST: five primary screens (Unlock, Home, Item, New, Settings), undo where safe, clear errors, no email required for local setup; first-run target under 60 seconds excluding import and OS permission dialogs.
- SHOULD: offer sync once after the first week and in Settings; never nag. Include recovery drills and fill receipts after basic MVP flows are stable.
- LATER: passkeys, cards, identities, SSH/Wi-Fi keys, attachments, sharing, Family/Teams, emergency access, account map, alias providers, duress PIN, travel mode, expiry reminders, breach response tools and encrypted LAN/QR transfer. Core security features remain free when introduced.
- LATER: personal self-hosting without the hosted device cap, setup wizard, management-only web vault, content-free wake-up relay, Linux packages and CLI. Never expose vault-decryption keys to the hosted web sales site.

## 4. Platforms and autofill

Android APK and Windows desktop are the first public clients. Chrome, Edge and Firefox share extension logic with platform-specific manifests and native-host registration. Chromium derivatives are compatibility-tested, not individually promised. macOS, iOS and Safari use the same core and UI strategy, but ship only after their signing and device gates. Linux/CLI are stretch goals.
Android uses OS Autofill/Credential Manager adapters; iOS uses a native credential-provider extension. Desktop browsers use an extension plus native messaging. The extension holds neither a persistent vault nor keys and counts as its paired desktop device.
MUST: exact-host matching by default, HTTPS only, no page-load fill, no page-controlled picker, no hidden-field fill, explicit origin-bound requests and native-host extension allowlists. Reject cross-origin frames in MVP. Revalidate tab/frame/origin and request freshness after consent; cancel on navigation or focus change. Reject forged/replayed messages. Android verifies app identity and applicable asset links.
MUST: mark copied secrets sensitive where supported and clear after 30 seconds without overwriting a newer clipboard value. Warn on lookalike destinations. Native app accessibility/autotype is not the MVP browser-security mechanism.

## 5. Cryptography and unlock

MUST: vetted Go implementations of Argon2id (minimum 64 MiB, 3 passes), XChaCha20-Poly1305, HKDF and Ed25519; no custom primitives. Versioned, size-bounded, padded envelopes bind vault/item/revision through authenticated associated data. Account keys wrap vault keys; vault keys wrap item keys. Fresh CSPRNG salts/nonces and independent vectors are mandatory.
Vault password derives an unlock key that wraps the account key set. A separately generated recovery secret in an Emergency Kit provides recovery; neither Google nor the operator can reset vault encryption. Sync activation uploads existing ciphertext without changing item encryption. Final envelope and recovery formats are frozen in P0-07 before implementation.
MUST: hardware-backed wrapping and OS verification where supported, explicit fallback to vault password where not. App PIN is at least six digits and bound to hardware protection; five failures require the vault password. Re-ask vault password after 14 days. Reveal/export and sensitive operations require fresh verification, with vault-password fallback on unsupported hardware.
Best-effort secret lifetime minimization and screenshot/crash protection are required; Go/native/JS runtime copies prevent a universal zeroization guarantee. Experimental memory runtimes and hybrid sharing cryptography are out of MVP scope.

## 6. Identity, devices and synchronization

MUST: Google OIDC for cloud identity, validating signature, issuer, audience, expiry and flow binding; identify users by provider and stable subject, never email alone. Replace original OPAQUE/SRP with Google login plus separate vault unlock. Local use needs no account.
MUST: short-lived Tessera sessions, revocable device credentials, account/vault authorization on every authenticated endpoint, and enrollment approved by an existing unlocked device or recovery flow. Browser/native OAuth flows use platform-safe redirects and PKCE where applicable.
MUST: per-vault sequence cursors, idempotent push requests with base revisions, transactional acknowledgments, deterministic client-side per-field conflict resolution, losing values retained in encrypted history, delete/edit conflicts preserved, signed heads and persisted last-seen checkpoints. A newly restored device cannot independently prove a server's full history; disclose this boundary.
MUST: durable local outbox, bounded retries with jitter, pending/offline status, atomic quota enforcement and no lost acknowledged writes on restart. Revoked devices cannot sync; revocation cannot erase data already copied.
MUST: disabling sync retains the complete local vault. Authenticated deletion of cloud data is separate and explicit. No silent deletion on cancellation or quota exhaustion.

## 7. Plans and billing

Prices are hypotheses, not provider quotes. Local Free: unlimited local items and core security/backup/export. Cloud Free: two enrolled devices, up to 10,000 hosted items and 25 MB total hosted storage. Member: US$2.99/month or US$24/year, uncapped devices subject to abuse controls, 250 MB hosted storage, extended synced history for 90 days, automatic encrypted cloud restore points for 30 days and a priority support queue without an SLA.
History and restore points count toward quotas. Show usage; stop new writes before exhaustion without discarding current items. Free users can remove devices; retain the original two replacement enrollments per rolling 30 days, with recovery support for lost devices.
MUST: self-service cancel-anytime portal, access until paid-period end, then user chooses two syncing devices. Preserve local edit/export/backup and hosted read/export access during over-quota remediation. No surprise charges or automatic local locks.
Paddle is the first merchant-of-record candidate; Dodo is the fallback if onboarding or product eligibility fails. Qualify before integrating; implement only the approved provider. Hosted checkout, verified idempotent webhooks, persisted event processing and reconciliation drive server-side entitlements; redirect success never grants access.
No regional payment split in MVP. Razorpay remains a later business decision. Payment identity linkage is disclosed; do not promise anonymous billing. Maintain transaction/payout records from first sale.

## 8. Hosting, availability and cost

MUST: stateless Go API on Render Free; Neon Free Postgres holds persistent server data. Device SQLite is independent. No Oracle, Render filesystem database, expiring Render Free Postgres, trial-credit dependency or automatic paid upgrade.
Cloudflare Pages hosts a static sales site on its free hostname initially; GitHub Releases stores binaries. Public GitHub standard runners are the initial CI target. Exact verified limits belong in VERSIONS, not this document.
MUST: qualify provider accounts/regions/limits in P0-06. Render cold starts and suspension are expected; offer limited public cloud beta availability without an SLA. Local vault access must never wait for network service.
MUST: bounded Postgres pooling, TLS with hostname verification, connection/query deadlines, rate limits, request size limits, signup abuse controls, storage and compute budgets. Reserve capacity for backups/history and operations; cap enrollment and new purchases before exceeding free capacity. Never evade provider idle policies.
MUST: encrypted database exports to an owner-controlled independent location; no public backup artifacts. Restore and rollback are performed before cloud beta. Database credentials and backups must never appear in PR jobs, logs or repository files.
Use container-compatible binaries and portable SQL/migrations for eventual paid hosting/AWS. First revenue may fund upgrades, but no spending without owner authorization.

## 9. Privacy and observability

MUST: optional first-party aggregate diagnostics default on only where lawful, with a visible pre-transmission opt-out and persistent settings control; obtain consent where required. Explicit offline mode overrides diagnostics. Disable clears queued events and prevents further optional transmissions.
Allow only enumerated event codes, coarse platform/version, latency buckets and counters. Exclude titles, URLs, emails, account/device IDs, clipboard data, screenshots, free-form logs and raw exceptions. Use a separate unauthenticated endpoint without account cookies/tokens; aggregate at ingestion without retaining individual event history.
Network infrastructure can observe IP/connection metadata. Describe this honestly as privacy-preserving aggregate metrics, never "100% anonymous". Configure provider access-log retention/minimization during qualification.
Operational security and billing records have separate documented purposes/retention. Error convention: stable code, safe user message, retryability and optional opaque request ID; never echo submitted secrets. Telemetry/legal copy must accurately distinguish optional analytics from essential records.

## 10. Distribution and website

MUST: website-first signed Android APK and Windows downloads, versioned checksums, signed release manifest, source links, installation instructions and honest security status. A hash detects corruption; a trusted signing key authenticates origin. Update verification uses a pinned trust root and rejects tampered or incomplete releases.
MUST: publish artifacts before promoting a stable release on the site; exclude prereleases. Initial informational website supports provider qualification; polished SEO sales pages and synthetic product demos follow working product flows. Include pricing/cancellation, privacy, terms and refund information before taking payments.
Chrome/Edge/Firefox and Apple distributions follow their platform signing/store requirements even when native apps use direct downloads. No assumption of unrestricted iOS website installation. Registration/signing fees require separate owner authorization. Android verification obligations must be checked before distribution.
2015 MacBook Pro is a compatibility test device, not an assumed current Xcode build host. Use supported hosted macOS builders and iPhone testing when the required Apple account/signing route is available. Apple distribution does not delay qualified Android/Windows releases.

## 11. Quality and release gates

MUST: independently specified vectors and test expectations before high-risk implementation; property tests for parsing, permission/state transitions and conflict convergence; fuzzing for parsers and envelopes; race tests for Go concurrency; migration and backup/restore tests; upgrade tests from the previous two released versions once available.
MUST: production builds pass the incident-inspired security corpus on the exact release commit. Include tampered/stolen backups, KDF downgrades, session leakage/replay, cross-account access, forged extension requests, deceptive origins/frames, clipboard/memory lifetime, rollback, unsafe imports and billing replay. Map each case to its threat/source and actual assertion; never claim all past/unknown attacks are covered.
Owner explicitly approved public launch before an external specialist audit. Label unaudited status visibly and never equate CI with an audit. Fresh independent review remains required for high-risk changes before merge.
MUST: WCAG 2.2 AA, keyboard/screen-reader support, localization and RTL from first release. Budget targets on documented reference hardware: unlock <1 second, search <50 ms at 10,000 items, suggestions <300 ms excluding the user's verification gesture. Never reduce the KDF floor to meet a target.
MUST: PR check order is formatting, lint, types/build, tests, >=90% changed executable-line coverage, secrets, dependency vulnerabilities, SAST, scope gate, test guard. Generated code is excluded explicitly; missing applicable checks fail. Phase/release gates add mutation testing, full platform E2E, extended fuzzing, SBOM and restored backups.

## 12. Contracts and implementation ownership

Machine-readable files, not prose duplicates, own each wire/storage format. P0-02 owns `contracts/health.schema.json`; P0-07 introduces API/OpenAPI, vault/backup/native-bridge/extension/telemetry JSON Schemas and `server/migrations/`. Generated types or validation tests bind implementation to these contracts.
`tools/toolchain.json` pins development tools and scanner download integrity; `package-lock.json` pins Node dependencies; `go.mod`/`go.sum` pin Go dependencies. BLUEPRINT owns item scope and expectations; tooling reads its fields directly rather than maintaining a second task list.
Foundations precede consumers. P0-02 owns CI/tool checks and the error/liveness scaffold; P0-04/05 own native secret handling and browser consent; P0-06 owns cost/provider/legal feasibility; P0-07/08 own schemas/validation/encryption; P0-09 owns authentication/authorization and enrollment abuse; P0-10 owns integrity/concurrency/quota/rate limiting; P0-11 owns deploy/migration/backup/restore/rollback. E1 owns full UX/privacy/performance/accessibility and MVP recovery; E2 owns billing/sales; E3 owns public release security; E4 Apple; E5 stretch features.

## 13. Legal flags, assumptions and exclusions

Server code: AGPL-3.0-only; client code: GPL-3.0-only; shared core: MPL-2.0. Add authoritative license texts and notices before distributing product code; tooling uses MIT. Commercial-only modules and contributor agreements require an explicit later legal design, not an implied relicensing of external contributions.
The Tessera name is a proposed brand, not a claim of registered trademark. Verify availability before public marketing. Review redistribution/signing and dependency license compatibility for each platform.
India business payouts and global sales are assumed. Merchant-of-record handling of customer taxes does not establish the owner's Indian GST/income-tax obligations. No blanket registration exemption is asserted. Before live billing, establish obligations with a qualified professional if unclear; do not block development on incorporation by assumption.
Open prerequisites: GitHub remote (blocks publication, not local commits); Render/Neon/Cloudflare/Google accounts (P0-06/09/11); payment approval/legal identity (E2); native SDKs and secure-store binding proof (P0-03/04); Apple/extension distribution accounts and fees (E3/E4). Use synthetic data only until release gates pass.
Excluded from MVP: web vault decryption, desktop autotype as a browser replacement, unlimited hosted capacity, guaranteed anonymity/zeroization/availability, enterprise compliance claims and an external audit completion promise. These exclusions do not relax the security/recovery gates above.
