# Tessera

Keep your word. A local-first password manager with an optional encrypted cloud service.

**Development scaffold only. No usable vault, qualified cloud service or audited release exists yet. Use synthetic data.**

The approved design uses Go, React/TypeScript, Capacitor, Wails, Render and Neon. Android and Windows lead; browser integrations and Apple qualification follow the scoped blueprint.

## Windows setup

1. Install the exact Node, Go and just versions in `docs/VERSIONS.md` (or use `mise install` after reviewing `mise.toml`).
2. Run `npm ci --ignore-scripts`, then `node tools/bootstrap.mjs` to install checksum-verified local scanner binaries.
3. Run `git config core.hooksPath .githooks`, then `just doctor` and `just brief`. Create the selected scoped feature branch before running `just check`.

Setup needs network access to public registries and scanner vulnerability databases. Missing prerequisites fail explicitly. Windows and Linux x64 scanner bootstrap are supported; Apple tooling is qualified separately.

## Commands

- `just doctor`: verify installed pins.
- `just check`: run all PR gates.
- `just fmt`: format repository sources.
- `just brief`: print handoff and next eligible blueprint item.
- `just map`: generate files and public-symbol navigation.
- `go run ./cmd/server`: start the liveness-only development server at `http://localhost:8080/healthz` (override with `PORT`).

Every just command also works as `node tools/task.mjs <command>`.

## Contributing

Read `AGENTS.md`, then follow `just brief`. Product requirements live in `docs/SPEC.md`; PR ordering lives in `docs/BLUEPRINT.md`. Supplied input specs remain unchanged for reference.
Work on feature branches from updated `main`. The owner merges. Dependency versions are pinned; upgrades require an explicitly scoped manual PR. Automatic Dependabot update PRs are disabled; vulnerability scans remain enabled.
Tooling is MIT; server code is AGPL-3.0-only. Planned client/core licenses and official texts are recorded in SPEC and `LICENSES/`.

## Publishing prerequisites

The repository is `devnadeemashraf/tessera`. Connected Render/Neon/Cloudflare/Google accounts are required for real deployment. Payment and Apple/browser distribution qualification are separate gates. Never paste credentials into issues or chat.
The zero-upfront-cost cloud target is a capacity-limited beta. Local vault availability must not depend on its uptime.
