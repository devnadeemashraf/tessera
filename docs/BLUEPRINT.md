# Ordered PR blueprint

Only Phase 0 is detailed. An open item remains open until its PR is merged; then replace its block with `ID — title — PR #number`. Work in S/M slices; split any item exceeding four sessions. No invented PR numbers. Scope fields below are machine-readable: literal backtick globs on the `Files in scope:` line, with exact `*`/`**` matching.

P0-01 — Canonical development kit (bootstrap accepted with scaffold) — PR #1
P0-02 — Reproducible tooling and Go liveness skeleton — PR #1

## P0-12 — Restore proposed pins and require manual dependency updates

Type: chore
Spec: 11, 12
Depends on: P0-02
Size: S
Risk: low
Tier: any
Decisions already made: owner requested no automatic dependency update PRs. Set all configured Dependabot version-update PR limits to zero; verify automatic security fixes are disabled separately. Preserve vulnerability alerts and scheduled CI scans. Restore @types/node 24.19.2 for Node 24.22.0 and retain every other proposed pin, including patched glob/minimatch overrides. Update merge/handoff records; no application behavior changes or new dependencies.
Files in scope: `.github/dependabot.yml` `package.json` `package-lock.json`
Test cases: restored manifest/lockfile/installed @types/node → 24.19.2; all other direct pins and overrides → unchanged; each configured ecosystem → zero version-update PR limit; repository automated-security-fixes → disabled; npm clean install, doctor and complete check → pass; merged bootstrap items → recognized complete by brief; no old branch/publication prerequisite remains in handoff.
Acceptance: `npm ci --ignore-scripts`, `just doctor`, `just check`, `just brief`; inspect the three disabled PR limits and GitHub automated-security-fixes state. Existing checks suffice for this configuration-only change.
Manual check: merge this maintenance PR before starting new feature work; verify GitHub's default-branch Dependabot configuration has zero PR limits. Subsequent dependency upgrades require an explicitly scoped item and review.

## P0-13 — Remove temporary-path dependence from gate-order assertions

Type: test
Spec: 11, 12
Depends on: P0-12
Size: S
Risk: low
Tier: any
Decisions already made: preserve all existing ordering expectations. Compare exact tool executable/module argument identities rather than substrings of joined absolute command paths; temporary directories may contain any tool name. This is a test-harness correction, not a change to check order.
Files in scope: `tests/tooling/tasks.test.mjs`
Test cases: temporary root includes `c8`, `typescript` or `eslint` with correctly ordered stages → ordering assertions pass; same roots with deliberately swapped stages → assertions reject; actual task dispatch → unchanged expected format/lint/types/tests/security order. Reproduce the false failure deterministically before the fix.
Acceptance: `just check`; deterministic stage-order regression passes without weakening or deleting existing assertions.
Manual check: none.

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
