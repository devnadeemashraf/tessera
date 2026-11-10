# Fix first

# In progress

- `chore/P0-02-development-tooling`: stacked on P0-01; tooling, guards and Go liveness are implemented and locally checked. Publish as a draft against `chore/P0-01-development-kit`, inspect hosted CI, then obtain fresh review. Items remain open until merged.

# Questions for the human

- The supplied public repository is `devnadeemashraf/tessera`, initially empty. Owner establishes `main` after reviewing the bootstrap branch, then retargets the tooling PR. No agent commit/merge to main.
- Render, Neon, Cloudflare and Google account access is needed for the real deployment/authentication gates. Never paste secrets into chat.

# Gotchas

- Input documents are historical and preserved; read canonical SPEC for approved changes.
- No native client, cloud account or payment provider has been qualified yet. Synthetic data only.
- Windows local checks do not run the Go race detector without a C compiler; Linux CI runs it. Hosted CI has not run without a remote.
- Keep unmerged items open; do not invent PR numbers or claim deployment/rollback without evidence.
