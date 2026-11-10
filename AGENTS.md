# Tessera contributor instructions

## Start and commands

1. Run `just brief` (or `node tools/task.mjs brief`). It prints HANDOFF and the first open item whose dependencies are merged. Without a shell, read HANDOFF and that BLUEPRINT item. Fix-first bugs take priority.
2. Read only the item's cited SPEC sections and scoped files. Use `just map` to locate files/public symbols. Read beyond scope only when blocked.
3. `just doctor` verifies tool pins; `just check` runs the complete PR gate; `just fmt` formats; `just brief` selects work; `just map` generates repository navigation.
4. Setup and platform commands live in README. Versions and verified external facts live in VERSIONS. Never infer a dependency version from model memory.

## PR loop

1. Branch from up-to-date main as `<type>/<ID>-<slug>`. During initial bootstrap only, dependent local feature branches may stack until the owner creates the remote. Never commit to or merge into main.
2. For high-risk work, write approach and one rejected alternative in at most five lines in the PR description before implementation.
3. Turn each blueprint case into a test with unchanged expectations; observe it fail before implementing behavior. Add cases freely, never weaken existing expectations.
4. Implement the smallest passing change using pinned tools. Check real API signatures when uncertain.
5. Run `just check` until green. Missing required tools/checks are failures, not successful skips.
6. An out-of-scope bug goes in HANDOFF / Fix first as one line with file and line; do not fix it in the current item. Its later fix needs a regression test.
7. Perform the self-review below. High-risk work also needs the independent review loop before merge.
8. After a PR merges, collapse its blueprint block to ID, title and actual PR number. Update HANDOFF only on changes, HANDBOOK only on its triggers, VERSIONS only on pin/fact changes. Never invent completion or a PR number.
9. Commit with Conventional Commits, push and open a PR with what changed, non-obvious reasoning (at most five lines), actual validation and manual checks. The owner merges.
10. Report in at most eight lines: changes, final actual check output, manual checks and risks. If publication is blocked, keep the local commit and give the missing prerequisite.

Stop and ask rather than guess if an item conflicts with SPEC, a test expectation is wrong, an unnamed dependency/decision is needed, check still fails after three attempts, or scope expands into auth, payments, deletion, migrations or secrets. SPEC changes require owner approval. Existing explicit owner authorization governs approved scope.

## Review loop

A fresh session (a different model when available) receives only the item and diff against main. It checks unchanged expected behavior, meaningful failure coverage, scope, security and data-loss risks. It reports findings in at most fifteen lines with file/line, edits nothing, and the implementing session fixes findings. Do not claim self-review is independent review. Do not spawn agents unless the owner asks.

## Phase gate

A strong model compares implementation to SPEC, reports drift, runs mutation/full E2E/extended fuzz/restore checks, proposes stale HANDBOOK/AGENTS corrections and expands only the next phase's epics. The owner manually exercises main flows before advancing. Repeated mistakes become executable checks; only use a written rule when automation is impossible. Phase 0 requires actual deployment, smoke, restore and performed rollback.

## Coding rules

1. Vault content, key material and recovery secrets never enter logs, telemetry, URLs, frontend persistence or analytics.
2. Cloud identity is distinct from vault unlock. Authorize account/vault/device on every service entry point.
3. Every secret fill is native-consented and bound to a fresh destination/request; page scripts cannot authorize it.
4. Treat remote state and imported input as hostile; enforce bounds before allocation or expensive KDF work.
5. Use stable safe error codes; never echo request data or raw exceptions. Deadlines and cancellation cross boundaries.
6. Contracts own wire/storage shapes; generate types or validate them. Never hand-edit generated code.
7. Persist before acknowledging; make retries idempotent; preserve conflict losers and recovery paths.
8. Keep test fixtures synthetic; cite independent crypto/security expectations before implementation.
9. Put Go tests next to packages; tooling tests in tests/tooling; integration/security fixtures under tests by subsystem.
10. Minimize secret lifetime honestly; do not claim managed-runtime zeroization or "100% anonymous" networking.
11. Do not add dependencies outside the item, additional documents, tool-specific instructions or TODOs without item IDs.
12. Do not read secret stores/files or reveal credentials. Use provider UI or environment injection for configured operations.

## API references

Go: local `go doc` at pinned Go version and https://pkg.go.dev/; Node: https://nodejs.org/docs/latest-v24.x/api/; TypeScript: https://www.typescriptlang.org/docs/; React: https://react.dev/reference/react; Capacitor: https://capacitorjs.com/docs/; Wails: https://v3.wails.io/; Chrome: https://developer.chrome.com/docs/extensions/; Firefox: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions. Read installed declarations/source for the exact dependency version. Mark unverified APIs/facts UNVERIFIED rather than inventing them.

## Self-review

- Every expected normal/failure behavior has a meaningful test; none was weakened.
- Diff is scoped; generated/vendor/input files are unchanged unless explicitly authorized.
- Secrets, account isolation, consent, retry and recovery boundaries hold.
- Errors, downtime and quota limits preserve local use and data.
- Required checks ran on the final code; missing hardware/provider evidence is explicit.
- Dependencies, licenses, tool pins and source links are verified.
- No main commit/merge, invented result or premature completion claim.
