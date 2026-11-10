import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import {
  parseBlueprint,
  nextItem,
  matchGlob,
  guardChanges,
  changedLines,
  checkCoverage,
  validCommit,
  assertFeatureBranch,
  validateDocuments,
} from "../../tools/lib.mjs";

const blueprint = `# Work\n## P0-01 — First\nDepends on: none\nFiles in scope: \`tools/**\` \`tests/tooling/a.test.mjs\`\n## P0-02 — Second\nDepends on: P0-01\nFiles in scope: \`server/*.go\`\n`;

test("blueprint chooses dependency-ready work and accepts collapsed merged items", () => {
  const items = parseBlueprint(blueprint);
  assert.equal(nextItem(items)?.id, "P0-01");
  assert.equal(items[0]?.scope[0], "tools/**");
  const merged = parseBlueprint("P0-01 — First — PR #12\n" + blueprint.slice(blueprint.indexOf("## P0-02")));
  assert.equal(nextItem(merged)?.id, "P0-02");
  assert.equal(nextItem(parseBlueprint("P0-01 — First — PR #12")), undefined);
});

test("malformed dependency graphs and scopes fail closed", () => {
  for (const bad of [
    blueprint.replace("Depends on: none", "Depends on: P0-02"),
    blueprint.replace("Depends on: none", "Depends on: P0-99"),
    blueprint + blueprint,
    blueprint.replace("`tools/**`", "`../**`"),
    blueprint.replace("Files in scope:", "Missing:"),
    blueprint.replace("`tools/**`", "`**`"),
  ]) {
    assert.throws(() => parseBlueprint(bad));
  }
});

test("scope rejects escapes, wrong branch, unknown item and rename/deleted test paths", () => {
  const items = parseBlueprint(blueprint);
  assert.doesNotThrow(() => guardChanges(items, "chore/P0-01-kit", ["tools/a.mjs", "docs/SPEC.md"], []));
  for (const branch of ["main", "master", "feature", "chore/P0-99-unknown"])
    assert.throws(() => guardChanges(items, branch, [], []));
  for (const path of ["server/new.go", "../tools/a", "tools/../../secret", "new/untracked.mjs"])
    assert.throws(() => guardChanges(items, "chore/P0-01-kit", [path], []));
  assert.throws(() => guardChanges(items, "chore/P0-01-kit", ["tools/old.test.mjs"], ["tools/old.test.mjs"]));
  assert.doesNotThrow(() =>
    guardChanges(items, "chore/P0-01-kit", ["tests/tooling/a.test.mjs"], ["tests/tooling/a.test.mjs"]),
  );
  assert.doesNotThrow(() => guardChanges(items, "chore/P0-01-kit", ["tools/new.test.mjs"], []));
  assert.throws(() => assertFeatureBranch("main"));
});

test("globs are anchored and star never crosses path separators", () => {
  assert.equal(matchGlob("server/*.go", "server/main.go"), true);
  assert.equal(matchGlob("server/*.go", "server/nested/main.go"), false);
  assert.equal(matchGlob("tools/**", "tools/nested/a.mjs"), true);
  assert.equal(matchGlob("a.b", "axb"), false);
  assert.equal(matchGlob("tools/**", "/tools/x"), false);
  fc.assert(
    fc.property(
      fc.array(fc.constantFrom("a", "b", "c"), { minLength: 1 }).map((x) => x.join("")),
      (name) => {
        assert.equal(matchGlob("tools/*.mjs", `tools/${name}.mjs`), true);
        assert.equal(matchGlob("tools/*.mjs", `other/tools/${name}.mjs`), false);
        assert.equal(matchGlob("tools/*.mjs", `tools/${name}/a.mjs`), false);
      },
    ),
  );
});

test("changed-line parsing handles additions, deletion and multiple files", () => {
  const lines = changedLines(
    "+++ b/tools/a.mjs\n@@ -1,0 +2,2 @@\n+x\n+y\n+++ /dev/null\n@@ -1,2 +0,0 @@\n-x\n-y\n+++ b/server/b.go\n@@ -2 +3 @@\n-a\n+b",
  );
  assert.deepEqual([...(lines.get("tools/a.mjs") ?? [])], [2, 3]);
  assert.deepEqual([...(lines.get("server/b.go") ?? [])], [3]);
  assert.equal(lines.has("/dev/null"), false);
});

test("coverage fails on missing evidence and below-threshold changed executable lines", () => {
  const changed = new Map([["tools/a.mjs", new Set([1, 2])]]);
  assert.throws(() => checkCoverage(changed, new Map()));
  assert.throws(() =>
    checkCoverage(
      changed,
      new Map([
        [
          "tools/a.mjs",
          new Map([
            [1, true],
            [2, false],
          ]),
        ],
      ]),
    ),
  );
  assert.equal(
    checkCoverage(
      changed,
      new Map([
        [
          "tools/a.mjs",
          new Map([
            [1, true],
            [2, true],
          ]),
        ],
      ]),
    ),
    100,
  );
  assert.equal(checkCoverage(new Map([["docs/a.md", new Set([1])]]), new Map()), 100);
  assert.equal(checkCoverage(new Map([["tests/tooling/a.test.mjs", new Set([1])]]), new Map()), 100);
});

test("commit messages and document limits are enforced", () => {
  assert.equal(validCommit("chore: bootstrap"), true);
  assert.equal(validCommit("fix(core)!: version envelope\n\nDetails"), true);
  assert.equal(validCommit("misc changes"), false);
  const docs = new Map([
    ["AGENTS.md", "a"],
    ["README.md", "r"],
    ["docs/SPEC.md", "s"],
    ["docs/BLUEPRINT.md", "b"],
    ["docs/HANDBOOK.md", "h"],
    ["docs/VERSIONS.md", "v"],
    ["docs/HANDOFF.md", "# Fix first\n# In progress\n# Questions for the human\n# Gotchas\n"],
  ]);
  assert.doesNotThrow(() => validateDocuments(docs));
  assert.throws(() => validateDocuments(new Map([...docs, ["docs/EXTRA.md", "x"]])));
  assert.throws(() => validateDocuments(new Map([...docs, ["README.md", "x\n".repeat(61)]])));
  assert.throws(() => validateDocuments(new Map([...docs, ["docs/HANDOFF.md", "# Wrong"]])));
  const missing = new Map(docs);
  missing.delete("docs/SPEC.md");
  assert.throws(() => validateDocuments(missing));
});
