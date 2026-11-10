# What I need

I'm a solo engineer building a product with AI models doing the implementation. Set up the project so that any model (strong or weak, from any vendor, in any coding tool) can pick up the next piece of work in a fresh session and do it the same way, with the highest accuracy I can get and as few tokens as possible spent on reading and writing documents.

Act as my architect and tech lead. Be direct, push back when scope is too big or risky, and prefer the smallest version that proves the idea.

Three principles drive every choice below:

1. Decide once, execute many times. You, the strong model, make the design decisions now and write them into the plan. Implementing sessions follow the plan; they should rarely need to decide anything.
2. Every document costs tokens each time it is read or updated. A fact lives in exactly one place. Anything the code, tests, config or git history already records is not written down again.
3. Accuracy comes from checks that do not depend on the model that wrote the code. A model that misunderstands a requirement writes tests that share the misunderstanding, and then reports success. So: expected behavior is specified before implementation, by you; everything that can be checked by a script is checked by a script; and risky changes are reviewed by a session that did not write them.

# My project (leave a line blank and you'll propose options)

- Name:
- What I want to build (a paragraph, or a pasted spec):
- Who it's for, and what "done" means for v1:
- Tech stack and hosting, or "propose":
- Target platforms:
- Constraints (budget, performance, scale, offline, compliance):
- My experience per area:
- Hours per week:
- OS I develop on:
- Git host and plan:
- AI tools and models I use:
- MODE: BUILD | LEARN (light | standard | intense)
- Must / must-not (licences, IP, privacy, minors, money):

# Ground rules

- Verify, don't recall. Before writing any version number, CLI flag, API, price, free-tier limit or licence term, check the official source today. If you cannot verify something, mark it UNVERIFIED and say how to check. Never invent an API.
- Tools must be free or open source unless I approve a paid one. For each tool you add, confirm it is maintained and that its licence allows my use, and record it in VERSIONS.
- Ask before building only if the answer would change the plan substantially: at most 5 questions, in one message, each with your default. Otherwise state your assumptions and continue.
- If the stack is blank or fits the constraints badly, give 2–3 options with trade-offs and a recommendation, then wait for my pick.
- Flag licence, IP, privacy, minors and money issues, and say when I need a professional. This is not legal or financial advice.

# Step 1: Understand

Restate the project in 5 lines, then list your assumptions, the top 3 risks with mitigations, and the open decisions. Ask your blocking questions or say there are none.

# Step 2: Generate the kit

Create exactly these seven documents and no others. Do not add a document later without my approval; if something seems to need a new file, it almost always belongs in a section of an existing one.

| File | Purpose | Limit | Read by a session | Updated |
|---|---|---|---|---|
| AGENTS.md | The only instructions file: rules, the two loops, commands | 150 lines | In full, every session | Rarely, by me or a strong model |
| docs/SPEC.md | What the product is and why | none | Only the sections the current item cites | Only with my approval |
| docs/BLUEPRINT.md | The ordered list of PRs | none | Only the current item | One edit per PR |
| docs/HANDOFF.md | What the next session must know that the blueprint doesn't say | 40 lines | In full, every session | Only when its content changes |
| docs/HANDBOOK.md | What a future contributor cannot learn from the code | none | Only a section an item cites | Only on a trigger (below) |
| docs/VERSIONS.md | Pinned versions and verified external facts | one line each | Only when adding or upgrading something | Only when a pin changes |
| README.md | What this is, setup on my OS, commands | 60 lines | Never by sessions | When setup changes |

Tool-specific files (CLAUDE.md, .cursor/rules, copilot-instructions and so on) are created only for the tools I named, and each contains one line pointing to AGENTS.md.

## docs/SPEC.md

Numbered sections so items can cite them: pillars; features tagged MUST, SHOULD or LATER; out of scope; non-functional requirements with measurable budgets; contracts; open decisions (each with the assumption in use and the first item it blocks); legal flags if any. If I pasted a spec, keep it and add only what is missing.

Contracts: wherever the product has a database schema, an API, a file or message format, or a config format, the source of truth is a machine-readable file in the repo (migration files, an API definition, a schema), and code types are generated from or validated against it. The SPEC names these files; it does not restate their content.

## docs/BLUEPRINT.md

Detail only the current phase. Later phases are one line per epic with the SPEC sections it covers.

Phase 0 is a walking skeleton: the thinnest end-to-end slice of the product, deployed to the real hosting target, with CI, one smoke test of the main user flow, and a rollback that has actually been performed once. This proves the PR loop and the riskiest integration points before features are built. Where the plan depends on something unproven (an API limit, a library's behavior, a performance budget), schedule a small time-boxed spike item early; its output is a Decisions entry.

Each open item uses this format and must be executable by a model that has read nothing else except AGENTS.md and the cited SPEC sections:

- ID, title, Conventional Commit type
- Spec: section numbers
- Depends on: item IDs
- Size: S (one session) or M (two to four). Anything larger must be split.
- Risk: low or high. High means it touches auth, permissions, payments, data model or migrations, deletion, secrets, concurrency or a public interface.
- Tier: any, or strong. High-risk items are implemented by a strong model or get the review loop; state which.
- Decisions already made: data shapes, names, libraries, error behavior. Leave nothing consequential for the implementer to choose.
- Files in scope, written as paths or globs a script can match, and anything that must not be touched
- Test cases: a list of concrete cases, each as given state and input → expected result, covering the normal path and every failure case that applies (invalid input, empty or oversized data, unauthorized user, duplicate or retried request, concurrent action, dependency slow or down). The implementer turns each case into a test and may add cases but may not change an expectation.
- Acceptance: the command that proves it, normally `check`
- Manual check: exact steps for me, or "none"

When an item is done it collapses to one line: ID, title, PR number. Git history holds the rest. No timeline, status log, history table or risk list lives in this file.

Before writing the blueprint, walk this list. Each concern must be owned by a named item, or dismissed with one line in SPEC's out-of-scope section saying why it does not apply: authentication and authorization on every entry point; input validation; secrets handling; data integrity and migrations; backup and restore; one error-handling convention; logging and error tracking; tests on critical paths; CI; deploy and rollback; rate limiting and abuse; performance budgets; cost limits; privacy and legal basics; accessibility. Also confirm every MUST feature in the SPEC maps to an item or epic, and that foundations (schema, auth, error format, test setup, CI) come before the features that need them.

## docs/HANDOFF.md

Four fixed headings: Fix first (bugs found in earlier PRs, one line each with file and line); In progress (written only when a session stops mid-item: branch, what is done, exact next step); Questions for the human; Gotchas. The next item is never written here; it is always the first open item in the blueprint whose dependencies are done.

## docs/HANDBOOK.md

Starts with an architecture overview of at most 20 lines (the components and how they talk) and an empty Decisions section. No placeholder sections and no hand-written file tree; the `map` command generates that. A PR adds to the handbook only when it introduces one of these: a new component or external service; a data model change; a flow that is not obvious from the code; an operational procedure (deploy, restore, rotate a secret); a lasting decision, recorded in Decisions in at most 5 lines (date, decision, why, alternative rejected). Most PRs do not touch it.

## AGENTS.md

Write it for the weakest model that will ever read it: numbered steps, exact commands, no reliance on any tool's special features. Contents:

1. The PR loop, the review loop and the phase gate below, verbatim in substance.
2. Commands: doctor, check, fmt, brief, map.
3. Coding rules that tooling cannot enforce, at most 25 lines (naming of domain concepts, the error convention, logging rules, test layout). Everything else goes in formatter and linter config.
4. Where to look up real API signatures for the main framework at the pinned version (local docs, a free docs-lookup tool, or the official URL).
5. Self-review checklist, at most 10 lines.
6. Never: commit to or merge into main; edit generated or vendored files; read secrets; change or delete an existing test's expectation; add a dependency the item doesn't name; create a new document; leave a TODO without an item ID.

The PR loop:

1. Run `brief`, which prints HANDOFF and the next item. With no shell, read docs/HANDOFF.md, then the first open blueprint item whose dependencies are done. Fix-first entries come before any item.
2. Read only the SPEC sections and files the item names. Use `map` to find things; read nothing else unless you are blocked.
3. Branch from up-to-date main: `<type>/<ID>-<slug>`.
4. If risk is high, write the approach and one rejected alternative in at most 5 lines before coding. This goes in the PR description.
5. Turn every listed test case into a test, with the expectations exactly as written, and watch them fail.
6. Make the smallest change that passes. Use the pinned versions; when unsure of an API, look it up as AGENTS.md says.
7. Run `check` until green.
8. If you find a bug outside the item's scope, add one line to HANDOFF's Fix first and leave it alone. Every fix-first PR includes a regression test for the bug.
9. Go through the self-review checklist.
10. Documents: collapse the item to its done line. Edit HANDOFF only if its content changed. Edit HANDBOOK only on a trigger. Edit VERSIONS only if a pin changed.
11. Commit with Conventional Commits, push, open the PR with: what changed, why this way (non-obvious points only, at most 5 lines), manual check steps. Never merge; I merge.
12. Report in at most 8 lines: what changed, the final lines of the actual `check` output, manual check needed, risks.

Stop and ask me, instead of guessing, when: the item is ambiguous or conflicts with the SPEC; a listed test expectation looks wrong; the work needs a dependency or a decision the item doesn't state; `check` still fails after 3 attempts; the change would touch auth, payments, deletion, migrations or secrets beyond what the item says. A needed SPEC change is a question for me, never an edit.

The review loop (items marked for review only): a fresh session, on a different model from the implementer where I have one, receives only the blueprint item and the diff against main. It checks that every listed test case exists with its expectation unchanged, that failure cases are really exercised, that nothing outside scope changed, and that the change has no security or data-loss problem. It reports findings in at most 15 lines with file and line, and edits nothing. The implementing session fixes them.

The phase gate (end of every phase, strong model): compare what was built against the SPEC and report drift; run the slow checks listed under Tooling; propose corrections to any stale HANDBOOK or AGENTS.md lines; split the next phase's epics into items. I run through the main flows by hand before the next phase starts. When the same kind of mistake has appeared twice, turn it into a lint rule or a check; only if that is impossible, add one line to AGENTS.md.

## Tooling

Choose what fits the stack. The names in brackets are examples to evaluate, not requirements; verify each before adopting it.

- Pinned toolchain and a task runner (mise, just) with five tasks: `doctor` (tools match the pins), `check` (everything CI runs on a PR), `fmt`, `brief` (prints HANDOFF and the next open item), `map` (prints the file tree and public symbols, generated by a script, e.g. with universal-ctags).
- Formatter, linter and the strictest practical type checking, carrying the coding standard; .editorconfig, .gitignore, .gitattributes.
- `check` runs, in this order: format check, lint, types, tests, test coverage of the changed lines against a threshold you set, secret scan (gitleaks), dependency vulnerability scan (OSV-Scanner, Trivy), static security analysis (Semgrep, Opengrep), and two small scripts of your own:
  - scope gate: reads the item ID from the branch name and fails if the diff touches files outside that item's "Files in scope" (the seven documents excepted);
  - test guard: fails if an existing test file was deleted or had assertions changed, unless the item lists that file.
- Property-based tests (Hypothesis, fast-check) wherever an item handles parsing, money, dates, permissions or state transitions; say so in the item's test cases.
- Slow checks, run at the phase gate and on a schedule, not on every PR: mutation testing on the high-risk modules (Stryker, mutmut, cargo-mutants), the full end-to-end suite (Playwright), a restore from backup.
- Git hooks (lefthook, pre-commit): format on commit, Conventional Commit message check, refuse pushes to main.
- CI: runs `check` on every PR; automated dependency updates (Renovate, Dependabot); a PR template of at most 10 lines. Tell me exactly which branch protection my git plan allows and how to require CI to pass before merge.
- If a tool I named supports a session-start hook, add one that runs `brief`. Add no subagents, skills, commands or MCP servers unless I ask.

`check` must pass on the empty skeleton. Run it and show the output, or say plainly that you could not run it.

# LEARN mode (skip entirely in BUILD mode)

Same blueprint, same loops, same quality bar. In each PR, carve exercises out of the real work: 1 every 2–3 PRs on light, 1–2 per PR on standard, 2–3 per PR on intense. Add one file, docs/LEARNING.md, with one line per skill area (level 0–4, last practised, weak spot) and the current exercise.

- Areas: data structures and algorithms with Big-O analysis; testing; debugging; performance; design and architecture; reliability and security; concurrency and systems; craft (refactoring, review, git, CI).
- Pick each exercise from the areas with the lowest level or the oldest practice date that the current item naturally touches. Rotate the type: implement behind a stub, bug hunt on a practice branch, optimise against a budget, write the tests, review a seeded PR, write the design first, explain the code.
- Give the exercise in the session, not in a file: a brief of at most 10 lines, the exact function and signature, failing tests, a timebox. Reveal hints one level at a time, only when I ask.
- Review my work by running `check` first, then scoring correctness, complexity, tests, readability, performance and security from 1 to 4 with line references. Ask questions before showing fixes. Show a reference solution after my second failed attempt or on request. My code merges at the same bar as AI code. If I say "skip", finish it yourself and reschedule the area.

# Delivery

1. First response: Step 1 only.
2. After my answers: every file in full, with no placeholders, in this order: SPEC, BLUEPRINT, AGENTS.md, HANDOFF, HANDBOOK, VERSIONS, README, tooling. If it won't fit in one reply, stop at a file boundary, say which files remain, and continue when I say so.
3. Finish with the `check` output and my first 3 steps.