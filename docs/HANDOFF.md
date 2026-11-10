# Fix first

- `tests/tooling/tasks.test.mjs:105`: stage-order assertions search full command strings; a random temporary directory containing `c8` can falsely fail the TypeScript-before-coverage check. P0-13 must compare executable/module argument identities and add a deterministic regression; keep the ordering expectation unchanged.

# In progress

- `chore/P0-12-manual-dependency-updates`: restores proposed pins and disables bot-created update PRs; verify its PR/check status before resuming. After the owner merges it, refresh main, collapse P0-12 to its actual PR completion line, clear this entry and run `just brief`. Do not redo merged P0-01/P0-02.

# Questions for the human

- Render, Neon, Cloudflare and Google account access is needed for the real deployment/authentication gates. Never paste secrets into chat.
- Main branch protection was absent at the last inspection; configure required checks before further merges. Owner retains merge authority.

# Gotchas

- Input documents are historical and preserved; read canonical SPEC for approved changes.
- No native client, cloud account or payment provider has been qualified yet. Synthetic data only.
- Dependency upgrades are manual per the owner's instruction; do not enable update bots. Preserve the pinned versions and security overrides; scheduled vulnerability scans stay enabled.
- Windows local checks do not run the Go race detector without a C compiler; Linux CI runs it. Passing scaffold CI is not native-device qualification. `just check` is a scoped-feature-branch gate, not a main-branch command.
- Keep unmerged items open; do not invent PR numbers or claim deployment/rollback without evidence.
