/** @typedef {{id:string, scope:string[], dependencies:string[], done:boolean, text:string}} Item */

export const kit = [
  "AGENTS.md",
  "README.md",
  "docs/SPEC.md",
  "docs/BLUEPRINT.md",
  "docs/HANDOFF.md",
  "docs/HANDBOOK.md",
  "docs/VERSIONS.md",
];
const historical = ["docs/TESSERA_SPEC.md", "docs/PROJECT_SCAFFOLD.md"];

/** @param {string} input @returns {Item[]} */
export function parseBlueprint(input) {
  /** @type {Item[]} */
  const items = [];
  const collapsed = /^(P\d+-\d+) — .+ — PR #\d+\s*$/gm;
  for (const match of input.matchAll(collapsed))
    items.push({ id: match[1] ?? "", scope: [], dependencies: [], done: true, text: match[0] });
  const sections = input.replace(collapsed, "").split(/(?=^## P\d+-\d+ —)/m);
  for (const section of sections) {
    const id = /^## (P\d+-\d+) —/m.exec(section)?.[1];
    if (!id) {
      continue;
    }
    const dependencyLine = /^Depends on: (.+)$/m.exec(section)?.[1];
    const scopeLine = /^Files in scope: (.+)$/m.exec(section)?.[1];
    if (!dependencyLine || !scopeLine) throw new Error(`Missing machine-readable fields: ${id}`);
    const scope = [...scopeLine.matchAll(/`([^`]+)`/g)].map((match) => match[1] ?? "");
    if (!scope.length || scope.some((path) => !safePath(path) || path === "**")) throw new Error(`Unsafe scope: ${id}`);
    const dependencies = dependencyLine === "none" ? [] : dependencyLine.split(",").map((x) => x.trim());
    items.push({ id, scope, dependencies, done: false, text: section.trim() });
  }
  const byId = new Map(items.map((item) => [item.id, item]));
  if (byId.size !== items.length) throw new Error("Duplicate item ID");
  /** @type {Set<string>} */ const visited = new Set();
  /** @type {Set<string>} */ const active = new Set();
  /** @param {string} id */
  function visit(id) {
    if (active.has(id)) throw new Error(`Dependency cycle: ${id}`);
    if (visited.has(id)) return;
    const item = byId.get(id);
    if (!item) throw new Error(`Unknown dependency: ${id}`);
    active.add(id);
    item.dependencies.forEach(visit);
    active.delete(id);
    visited.add(id);
  }
  items.forEach((item) => visit(item.id));
  return items;
}

/** @param {Item[]} items */
export function nextItem(items) {
  return items.find(
    (item) => !item.done && item.dependencies.every((id) => items.some((dep) => dep.id === id && dep.done)),
  );
}

/** @param {string} path */
function safePath(path) {
  return (
    path.length > 0 &&
    !path.startsWith("/") &&
    !path.includes("\\") &&
    !path.includes(":") &&
    !path.split("/").some((part) => part === ".." || part === "." || part === "")
  );
}

/** @param {string} pattern @param {string} path */
export function matchGlob(pattern, path) {
  if (!safePath(pattern) || !safePath(path)) return false;
  const regex = pattern
    .split("**")
    .map((part) =>
      part
        .split("*")
        .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("[^/]*"),
    )
    .join(".*");
  return new RegExp(`^${regex}$`).test(path);
}

/** @param {string} branch */
export function assertFeatureBranch(branch) {
  const id = /^(?:feat|fix|docs|test|chore|refactor|perf|build|ci)\/(P\d+-\d+)-[a-z0-9-]+$/.exec(branch)?.[1];
  if (!id) throw new Error(`Expected scoped feature branch; got ${branch}`);
  return id;
}

/** @param {Item[]} items @param {string} branch @param {string[]} changed @param {string[]} existingTests */
export function guardChanges(items, branch, changed, existingTests) {
  const id = assertFeatureBranch(branch);
  const item = items.find((i) => i.id === id && !i.done);
  if (!item) throw new Error(`Unknown or completed item: ${id}`);
  for (const file of changed) {
    if (!safePath(file) || (!kit.includes(file) && !item.scope.some((glob) => matchGlob(glob, file))))
      throw new Error(`Out of scope: ${file}`);
  }
  for (const file of existingTests) {
    if (!item.scope.some((glob) => (glob === file || /test/i.test(glob)) && matchGlob(glob, file)))
      throw new Error(`Existing test change requires explicit test scope: ${file}`);
  }
}

/** @param {string} file */
export function isTest(file) {
  return /(?:^|\/)tests?\//.test(file) || /(?:_test\.go|\.test\.[cm]?[jt]sx?)$/.test(file);
}

/** @param {string} file */
export function isExecutable(file) {
  return /\.(?:go|[cm]?[jt]sx?)$/.test(file) && !isTest(file) && !file.endsWith(".config.mjs");
}

/** @param {string} diff @returns {Map<string, Set<number>>} */
export function changedLines(diff) {
  const result = new Map();
  let file = "";
  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ ")) file = line.startsWith("+++ b/") ? line.slice(6) : "";
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (file && hunk) {
      const start = Number(hunk[1]),
        count = hunk[2] === undefined ? 1 : Number(hunk[2]);
      if (!result.has(file)) result.set(file, new Set());
      for (let n = start; n < start + count; n++) result.get(file).add(n);
    }
  }
  return result;
}

/** @param {Map<string,Set<number>>} changed @param {Map<string,Map<number,boolean>>} evidence */
export function checkCoverage(changed, evidence) {
  let executable = 0,
    covered = 0;
  for (const [file, lines] of changed) {
    if (!isExecutable(file) || lines.size === 0) continue;
    const measured = evidence.get(file);
    if (!measured) throw new Error(`Missing coverage: ${file}`);
    for (const line of lines) {
      if (!measured.has(line)) continue;
      executable++;
      if (measured.get(line)) covered++;
    }
  }
  const percent = executable === 0 ? 100 : (100 * covered) / executable;
  if (percent < 90)
    throw new Error(`Changed executable-line coverage ${percent.toFixed(2)}% < 90% (${covered}/${executable})`);
  return percent;
}

/** @param {string} message */
export function validCommit(message) {
  return /^(feat|fix|docs|test|chore|refactor|perf|build|ci|revert)(\([a-z0-9/-]+\))?!?: .+/.test(
    message.split("\n")[0] ?? "",
  );
}

/** @param {Map<string,string>} documents */
export function validateDocuments(documents) {
  for (const file of kit) if (!documents.has(file)) throw new Error(`Missing document: ${file}`);
  for (const file of documents.keys())
    if (!kit.includes(file) && !historical.includes(file)) throw new Error(`Unauthorized document: ${file}`);
  for (const [file, limit] of /** @type {[string,number][]} */ ([
    ["AGENTS.md", 150],
    ["README.md", 60],
    ["docs/HANDOFF.md", 40],
  ])) {
    if ((documents.get(file) ?? "").trimEnd().split("\n").length > limit)
      throw new Error(`Document line limit: ${file}`);
  }
  const headings = (documents.get("docs/HANDOFF.md") ?? "").split("\n").filter((line) => /^#+ /.test(line));
  if (
    JSON.stringify(headings) !==
    JSON.stringify(["# Fix first", "# In progress", "# Questions for the human", "# Gotchas"])
  )
    throw new Error("Invalid HANDOFF headings");
}
