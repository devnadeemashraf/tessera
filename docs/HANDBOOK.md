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

2026-11-10 — P0-02 uses Node-built orchestration, strict JS type checking and Go standard-library liveness; no frontend or crypto dependencies before native feasibility. This avoids making an unqualified client look usable.
2026-11-10 — Scanner binaries are pinned by official release SHA-256 in toolchain.json. Trivy uses an empty Docker credential directory for public DB downloads; developer credential helpers are unnecessary.
2026-11-10 — Trivy includes development dependencies. Pin transitive glob/minimatch security overrides until upstream ESLint/c8 dependency ranges accept the fixed releases; exercise real lint and coverage commands rather than suppressing advisories.

# Development operations

The first two branches are stacked because the supplied repository was empty. The owner reviews the initial documentation branch and establishes main; retarget the tooling PR afterward. Do not mark a blueprint item complete until its actual PR merges. `brief` deliberately still selects an unmerged prerequisite; HANDOFF identifies work already prepared.
`check` inspects committed changes against main (root commit during bootstrap), staged/unstaged changes and untracked files. Set TESSERA_BASE to a full reviewed base SHA for stacked PRs; CI uses the PR base. Scope globs live only in BLUEPRINT. Test guard conservatively requires an explicit test path/glob for any existing test modification, not just detected assertion edits.
Changed-line coverage combines c8 statement spans and Go cover blocks. Test files and declarative ESLint config are excluded; executable tooling and runtime code are covered. Linux CI also runs the Go race detector; Windows needs a compatible C compiler to run it locally. Missing applicable tools, reports or scanner databases fail the gate.
Scheduled CI repeats baseline checks and scans without scope/test diff guards. Module-specific mutation, full native E2E, extended fuzz and real restore jobs must be supplied by their owning blueprint items; this scaffold does not claim those release gates exist yet.
Bootstrap installs only verified scanner archives under ignored `.tools`; no global binaries or secrets are modified. Native bindings, provider accounts, database migrations and deployment are not implemented by the liveness endpoint.

# Repository protection

For a public repository on GitHub Free, protect `main`: require a pull request, require the `check` status, require branches to be up to date, block force pushes/deletion and include administrators. Keep human merge ownership. A solo owner cannot approve their own PR, so do not require an unavailable second GitHub account; record independent high-risk review in the PR before merging. These settings are instructions, not a claim they have been applied.
