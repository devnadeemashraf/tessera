# Ordered PR blueprint

Only Phase 0 is detailed. An open item remains open until its PR is merged; then replace its block with `ID — title — PR #number`. Work in S/M slices; split any item exceeding four sessions. No invented PR numbers. Scope fields below are machine-readable: literal backtick globs on the `Files in scope:` line, with exact `*`/`**` matching.

## P0-01 — Canonical development kit

Type: chore
Spec: 1–13
Depends on: none
Size: S
Risk: low
Tier: any
Decisions already made: preserve both input documents byte-for-byte; create exactly the seven required kit documents; record approved Go/TypeScript, Render/Neon and business changes. No product implementation in this item.
Files in scope: `AGENTS.md` `README.md` `docs/SPEC.md` `docs/BLUEPRINT.md` `docs/HANDOFF.md` `docs/HANDBOOK.md` `docs/VERSIONS.md` `docs/TESSERA_SPEC.md` `docs/PROJECT_SCAFFOLD.md`
Test cases: seven kit documents exist → no extra prose docs; AGENTS <=150, README <=60, HANDOFF <=40 lines → pass; HANDOFF has exactly four mandated headings → pass; each MUST maps to an item/epic → owner mapping in SPEC 12; original inputs unchanged → pass.
Acceptance: document checks in `node tools/task.mjs check` after P0-02; before tooling exists, inspect line counts and source hashes.
Manual check: read SPEC 7–10 and confirm approved commercial/hosting choices; initial local commit is on a feature branch.

## P0-02 — Reproducible tooling and Go liveness skeleton

Type: chore
Spec: 8, 9, 11, 12
Depends on: P0-01
Size: M
Risk: high
Tier: strong implementation plus fresh review before merge
Decisions already made: Node-built task runner exposed by just; Prettier, ESLint/@eslint/js, TypeScript, @types/node, c8, fast-check; Go standard library only for liveness. Gitleaks CLI, Trivy filesystem dependency scan and gosec plus ESLint restricted unsafe APIs for SAST. Pinned public CLI binaries with SHA-256; no install scripts from dependencies. Git hooks are small versioned shell wrappers. No authentication, persistence, billing or crypto stubs pretending to work.
Files in scope: `tools/**` `tests/tooling/**` `server/**` `cmd/server/**` `contracts/health.schema.json` `.github/**` `.githooks/**` `.editorconfig` `.gitattributes` `.gitignore` `.prettierignore` `.prettierrc.json` `.npmrc` `eslint.config.mjs` `tsconfig.json` `package.json` `package-lock.json` `go.mod` `go.sum` `mise.toml` `justfile` `LICENSES/**`
Test cases: GET /healthz → exact schema response/no version or secrets; wrong method →405; unknown path →404; invalid port → startup rejects; headers/timeouts → bounded safe defaults. Invalid/unknown branch or out-of-scope path → guard fails; untracked path and rename destination → checked; test deletion/modification outside explicit item scope → fails; permitted test addition → passes. Missing/mismatched tools → doctor fails; missing coverage or uncovered changed line → fails; missing blueprint dependency/cycle/unsafe glob → fails; valid dependency order → next actionable item. Property-test glob/path handling. Empty scaffold check → all applicable gates run. No secrets in scanner output.
Acceptance: `just check`; `just doctor`; `just brief`; `just map`.
Manual check: run `go run ./cmd/server` and request http://localhost:8080/healthz; verify `just check` fails for an unauthorized temporary file, then remove that file.

## P0-03 — Shared UI and native binding feasibility

Type: feat
Spec: 2–5, 10–12
Depends on: P0-02
Size: M
Risk: high
Tier: strong implementation plus fresh review before merge
Decisions already made: React/TypeScript shared UI, Capacitor native mobile adapters, Wails desktop; gomobile Go bindings. Timebox two sessions. Verify exact maintained versions/licenses and binding-supported types before adding dependencies. Record passing/failing platform evidence in HANDBOOK; unresolved binding shape becomes a SPEC question, not a second core.
Files in scope: `apps/mobile/**` `apps/desktop/**` `packages/ui/**` `core/bridge/**` `tests/native/**` `package.json` `package-lock.json` `go.mod` `go.sum` `tools/**` `.github/workflows/native.yml`
Test cases: native roundtrip of a synthetic non-secret value → identical on Windows and Android; malformed/oversized bridge input → rejected; absent native host → visible unavailable state; unsupported API type → fails generation; offline shell → no requests. Apple toolchain/signing absent → explicitly unqualified, never reported built.
Acceptance: `just check` plus native smoke commands recorded by the spike at verified framework versions.
Manual check: launch Windows and Android shells; observe the same synthetic roundtrip; record iPhone/Mac build prerequisites.

## P0-04 — Native protection and consent spike

Type: test
Spec: 2, 4, 5, 11
Depends on: P0-03
Size: M
Risk: high
Tier: strong implementation plus fresh review before merge
Decisions already made: OS-backed wrapping and native per-operation verification; synthetic keys only. Android Keystore/BiometricPrompt and Windows Hello/OS key protection; validate capability before choosing fallback. No web PIN prompt authorizes native secret release.
Files in scope: `apps/mobile/**` `apps/desktop/**` `core/bridge/**` `tests/native/**` `contracts/native-bridge.schema.json`
Test cases: approved current request → one synthetic secret release; denied/expired/replayed request → none; lock/restart → no retained unwrapped key; hardware unavailable → password fallback only; UI logs/crash capture → no sentinel secret. Five wrong PIN attempts → password required. Property-test consent state transitions.
Acceptance: `just check` and native tests; required hardware capability failures block release rather than being skipped.
Manual check: approve, deny, cancel and lock during a request on Android and Windows; inspect native prompts and sentinel absence in frontend storage.

## P0-05 — Browser-to-native origin proof

Type: feat
Spec: 4, 11, 12
Depends on: P0-04
Size: M
Risk: high
Tier: strong implementation plus fresh review before merge
Decisions already made: shared TS extension logic, Chromium and Firefox adapters, exact native-host allowlists, app-owned picker, no persistent extension vault. Initial integration fills synthetic credentials only. No cross-origin frames in MVP.
Files in scope: `apps/extension/**` `apps/desktop/**` `core/matching/**` `contracts/extension.schema.json` `tests/autofill/**` `package.json` `package-lock.json`
Test cases: allowed HTTPS host plus fresh approval → fill selected visible fields once; HTTP/lookalike/subdomain/cross-origin/hidden field → reject; navigation/focus change after approval → cancel; forged extension/replay/oversized message → reject; desktop absent/locked → safe unavailable/verification prompt. Property-test origin and permission decisions.
Acceptance: `just check` plus Chrome, Edge and Firefox native integration suite.
Manual check: perform positive and deceptive-origin fills in each browser using synthetic test pages.

## P0-06 — Free hosting and merchant qualification

Type: chore
Spec: 7–10, 13
Depends on: P0-02
Size: M
Risk: high
Tier: strong implementation plus fresh review before merge
Decisions already made: Render Free stateless Go, Neon Free Postgres, Cloudflare Pages static Astro/React informational site. No Oracle or paid upgrades. Verify account availability, commercial eligibility, pool TLS/deadlines, limits and provider log handling. Paddle first, Dodo fallback; do not integrate billing yet. Missing accounts block actual qualification, not local tooling.
Files in scope: `infra/**` `apps/site/**` `server/config/**` `tests/hosting/**` `package.json` `package-lock.json` `go.mod` `go.sum` `.github/workflows/site.yml`
Test cases: free deployment → public TLS health response; restart/sleep → external synthetic DB row persists; invalid DB TLS certificate → reject; DB unavailable/cold-start → bounded failure and recovery; missing credentials → no deployment; usage threshold → admissions disabled; website → no invented downloads/audit claims; payment approval absent → checkout unavailable.
Acceptance: `just check` and real hosting smoke evidence in HANDBOOK; record provider limits and approval facts in VERSIONS.
Manual check: owner connects accounts, reviews zero-cost billing settings, verifies HTTPS and provider eligibility; no credentials pasted into chat.

## P0-07 — Frozen storage and protocol contracts

Type: feat
Spec: 5, 6, 8, 9, 11, 12
Depends on: P0-04, P0-06
Size: M
Risk: high
Tier: strong implementation plus fresh review before merge
Decisions already made: OpenAPI plus JSON Schema and SQL migrations; Go validates or generates types, TS types derive from schemas. Account/vault/item key hierarchy and separate recovery wrapping; versioned padded envelopes; client KDF floor. Select concrete Go crypto/SQLite/Postgres libraries only after verified compatibility and record pins before implementation. Freeze byte-level vectors before P0-08; peer review design against SPEC before consumers exist.
Files in scope: `contracts/**` `server/migrations/**` `tests/fixtures/**` `tests/contracts/**` `tools/contracts/**` `package.json` `package-lock.json` `go.mod` `go.sum`
Test cases: independent valid envelope/API/backup fixtures → accepted; wrong version/truncated/oversized/invalid identifier/KDF below floor → rejected; cross-vault AAD change → authentication fails; schema-generated types drift → CI fails; metadata fixture inspection → titles/URLs absent from cleartext. Property-test parser bounds.
Acceptance: `just check` plus independently reviewed fixture provenance and native binding conformance.
Manual check: review recovery and key-loss behavior, formats and error messages before implementation.

## P0-08 — Smallest encrypted local vault

Type: feat
Spec: 3, 5, 11, 12
Depends on: P0-07
Size: M
Risk: high
Tier: strong implementation plus fresh review before merge
Decisions already made: vetted primitives and SQLite selected in P0-07; one login item create/save/lock/reopen and encrypted backup/restore; transactional storage and password/recovery wrapping. Never roll a primitive or silently downgrade the KDF.
Files in scope: `core/**` `apps/mobile/**` `apps/desktop/**` `tests/crypto/**` `tests/storage/**` `tests/backup/**` `go.mod` `go.sum`
Test cases: independent vectors → exact outputs; wrong password/tampered header/body → no plaintext; restart after save → identical item; interrupted write → old or complete new item; backup restored into empty store → same vault; wrong/corrupt backup → no overwrite; generated nonces → collision checks and CSPRNG failure propagation. Property/fuzz tests for envelopes and restore input.
Acceptance: `just check`, bounded fuzzing and native synthetic-vault roundtrip.
Manual check: save synthetic login, lock/restart, restore on clean install, then try wrong password and corrupt backup.

## P0-09 — Google identity and device enrollment

Type: feat
Spec: 5, 6, 8, 9, 11
Depends on: P0-08
Size: M
Risk: high
Tier: strong implementation plus fresh review before merge
Decisions already made: Google OIDC stable subject identity; independent vault password; revocable device-scoped sessions; server-side authorization and rate limiting. Existing device or Emergency Kit authorizes enrollment. Use approved contracts; no email-as-primary-key or Google-based vault reset.
Files in scope: `server/auth/**` `server/devices/**` `server/migrations/**` `core/enrollment/**` `apps/mobile/**` `apps/desktop/**` `tests/auth/**` `go.mod` `go.sum`
Test cases: valid account/device → own authorized data only; forged/expired/wrong-audience/wrong-issuer/replayed token → reject; different account or revoked device → reject; simultaneous enrollment at cap → only permitted count; Google unavailable → local unlock works; lost vault password without recovery → Google cannot decrypt. Property-test authorization and enrollment transitions.
Acceptance: `just check` and real test-account sign-in using configured redirect URIs.
Manual check: sign in on two test installs, revoke one, verify local access remains and server sync stops.

## P0-10 — Durable two-client encrypted sync

Type: feat
Spec: 6–9, 11, 12
Depends on: P0-09
Size: M
Risk: high
Tier: strong implementation plus fresh review before merge
Decisions already made: Postgres transactions, durable local outbox, idempotency, base revisions, signed heads/checkpoints, bounded retry, ciphertext-only vault fields. Free quotas and two-device cap enforced atomically; no billing dependency for free sync.
Files in scope: `server/sync/**` `server/migrations/**` `core/sync/**` `apps/mobile/**` `apps/desktop/**` `tests/sync/**` `tests/abuse/**` `go.mod` `go.sum`
Test cases: offline edits on two clients → convergent state and losing values retained; duplicate/reordered push → one effect; delete/edit conflict → preserved history; crash after ack → durable row; stale signed head → rollback warning; account isolation and revoked request → denied; exhausted quota → no partial write; dependency outage → local data remains editable. Property-test merge convergence and retry state transitions.
Acceptance: `just check` plus Go race tests and two-client offline/reconnect smoke.
Manual check: edit offline on both installs, reconnect through an API restart, inspect convergence and history.

## P0-11 — Deployed walking-skeleton gate

Type: chore
Spec: 8, 10–13
Depends on: P0-05, P0-10
Size: M
Risk: high
Tier: strong implementation plus fresh review before merge
Decisions already made: manually triggered deployment from reviewed commit; backward-compatible migrations; encrypted independent DB export before migration; owner-operated backup initially, not public CI artifacts. Record actual smoke, restore and rollback evidence without secrets. Do not mark Phase 0 complete from local mocks.
Files in scope: `infra/**` `tools/ops/**` `tests/e2e/**` `tests/restore/**` `.github/workflows/deploy.yml` `.github/workflows/security.yml`
Test cases: real two-client synthetic vault sync → persists across restart; backup restored to isolated DB → same authenticated contents; prior compatible app deployment → works with current schema; failed migration → no promoted release; bad signing key/tampered artifact → promotion denied; missing release checks → blocked; cold start/quota/provider outage → offline access unaffected.
Acceptance: `just check`, slow security/E2E/restore gates, real smoke and performed rollback recorded in HANDBOOK.
Manual check: owner runs complete create/lock/fill/offline/sync/restore flows and approves next-phase expansion; unavailable provider access keeps this gate open.

## Later epics

- E1 — Complete Android/Windows local + cloud MVP, browser conformance, imports, local scheduled backups, telemetry, recovery, UX/localization/accessibility and performance (SPEC 2–6, 8–9, 11).
- E2 — Approved merchant integration, cancellation/entitlements, Member history/restore points, SEO sales demos and stable-release website automation (SPEC 7–10, 13).
- E3 — Public beta qualification, incident regression corpus, signed/reproducible release pipeline, install compatibility, independent reviews and unaudited disclosure (SPEC 4, 8, 10–13).
- E4 — Qualified macOS/iOS/Safari native integration, signing and physical-device release gates (SPEC 3–5, 10–11).
- E5 — Passkeys, remaining item types, sharing/Family/Teams, personal self-hosting, Linux and CLI; retain free core security (SPEC 3, 7, 13).
