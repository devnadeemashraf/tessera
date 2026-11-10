# Fix first

# In progress

- `chore/P0-02-development-tooling`: published as draft PR #1 against `chore/P0-01-development-kit`; tooling, guards and Go liveness are locally checked. Next: inspect the latest PR check result and obtain fresh independent review. Items remain open until merged.

# Questions for the human

- The supplied public repository is `devnadeemashraf/tessera`, initially empty. Owner establishes `main` after reviewing the bootstrap branch, then retargets the tooling PR. No agent commit/merge to main.
- Render, Neon, Cloudflare and Google account access is needed for the real deployment/authentication gates. Never paste secrets into chat.

# Gotchas

- Input documents are historical and preserved; read canonical SPEC for approved changes.
- No native client, cloud account or payment provider has been qualified yet. Synthetic data only.
- Windows local checks do not run the Go race detector without a C compiler; Linux CI runs it. Current hosted evidence is on PR #1; do not infer native-device qualification from that job.
- Keep unmerged items open; do not invent PR numbers or claim deployment/rollback without evidence.
