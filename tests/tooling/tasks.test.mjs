import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { createTasks, dispatch, runner } from "../../tools/task.mjs";
import { kit } from "../../tools/lib.mjs";

/** @param {import('node:test').TestContext} t */
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "tessera-tasks-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  /** @param {string} path @param {string} text */
  const write = (path, text) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  for (const path of kit) write(path, readFileSync(new URL("../../" + path, import.meta.url), "utf8"));
  write(
    "docs/BLUEPRINT.md",
    "P0-01 — Kit — PR #1\n## P0-02 — Tools\nDepends on: P0-01\nFiles in scope: `tools/**` `server/**` `tests/tooling/**`\n",
  );
  write("tools/a.mjs", "export const value = 1;\n");
  write("server/a.go", "package server\nfunc Value() int { return 1 }\n");
  write("tests/tooling/sample.test.mjs", "");
  const pins = JSON.parse(readFileSync(new URL("../../tools/toolchain.json", import.meta.url), "utf8"));
  write("tools/toolchain.json", JSON.stringify(pins));
  write("package.json", JSON.stringify({ devDependencies: { example: "1.0.0" } }));
  write("node_modules/example/package.json", JSON.stringify({ version: "1.0.0" }));
  write(
    "coverage/js/coverage-final.json",
    JSON.stringify({
      a: {
        path: join(root, "tools/a.mjs"),
        statementMap: { 0: { start: { line: 1 }, end: { line: 1 } } },
        s: { 0: 1 },
      },
    }),
  );
  write("coverage/go.out", "mode: set\ntessera.local/tessera/server/a.go:2.1,2.30 1 1\n");
  const all = [...kit, "tools/a.mjs", "server/a.go", "tests/tooling/sample.test.mjs"];
  /** @type {string[][]} */ const calls = [];
  const state = {
    branch: "chore/P0-02-development-tooling",
    main: false,
    badFormat: false,
    missing: false,
    testChange: false,
    versionSuffix: "",
    untracked: "",
  };
  /** @type {NodeJS.ProcessEnv} */ const env = {};
  /** @type {import('../../tools/task.mjs').Runner} */
  const run = (command, args) => {
    calls.push([command, ...args]);
    if (state.missing && /trivy(?:\.exe)?$/.test(command)) throw new Error("missing scanner");
    if (command === "git") {
      if (args[0] === "branch") return state.branch;
      if (args[0] === "rev-parse") {
        if (!state.main && args[2]?.startsWith("refs/")) throw new Error("no main");
        return "a".repeat(40);
      }
      if (args[0] === "merge-base" || args[0] === "rev-list") return "a".repeat(40);
      if (args[0] === "ls-files") return args.includes("--cached") ? all.join("\0") : state.untracked;
      if (args[0] === "diff" && args.includes("--diff-filter=MD")) return state.testChange ? "server/a_test.go" : "";
      if (args[0] === "diff" && args.includes("--name-only")) return "tools/a.mjs\0server/a.go";
      if (args[0] === "diff") return "+++ b/tools/a.mjs\n@@ -0,0 +1 @@\n+x\n+++ b/server/a.go\n@@ -0,0 +2 @@\n+x";
      throw new Error("unexpected git call");
    }
    if (command === "go" && args[0] === "version")
      return `go version go${pins.go}${state.versionSuffix} fixture/fixture`;
    if (command === "just") return `just ${pins.just}`;
    if (command === "gofmt" && args[0] === "-l") return state.badFormat ? "server/a.go" : "";
    for (const [name, pin] of Object.entries(/** @type {Record<string,{version:string}>} */ (pins.scanners)))
      if (command.endsWith(name) || command.endsWith(name + ".exe")) return pin.version;
    return "";
  };
  /** @type {string[]} */ const output = [];
  return {
    root,
    write,
    pins,
    state,
    calls,
    output,
    run,
    env,
    tasks: createTasks(root, run, (text) => output.push(text), env),
  };
}

test("task dispatch runs actual gates in order and navigation is generated", (t) => {
  const f = fixture(t);
  for (const command of ["doctor", "fmt", "brief", "map", "protect", "guards", "coverage", "check"])
    dispatch([command], f.tasks);
  assert.ok(f.output.some((line) => line.startsWith("PASS check:")));
  assert.ok(f.output.some((line) => line.includes("export const value")));
  assert.ok(f.calls.some((call) => call.includes("--scanners") && call.includes("vuln")));
  assert.ok(f.calls.some((call) => call.includes("--include-dev-deps")));
  const checkStart = f.calls.findLastIndex((call) => call.includes("--check"));
  const steps = f.calls
    .slice(checkStart)
    .map((call) => call.join(" "))
    .join("\n");
  assert.ok(steps.indexOf("eslint") < steps.indexOf("typescript"));
  assert.ok(steps.indexOf("typescript") < steps.indexOf("c8"));
  assert.ok(steps.indexOf("c8") < steps.indexOf("gitleaks"));
  assert.ok(steps.indexOf("gitleaks") < steps.indexOf("trivy"));
  f.write("message", "chore: fixture");
  dispatch(["commit-message", join(f.root, "message")], f.tasks);
  f.write("message", "invalid");
  assert.throws(() => dispatch(["commit-message", join(f.root, "message")], f.tasks));
  assert.throws(() => dispatch(["unknown"], f.tasks));
  assert.throws(() => dispatch(["commit-message"], f.tasks));
});

test("CI base and branch inputs are validated independently of ambient environment", (t) => {
  const f = fixture(t);
  f.env.TESSERA_BASE = "bad-ref";
  assert.throws(() => f.tasks.guards(), /full commit SHA/);
  f.env.TESSERA_BASE = "a".repeat(40);
  f.tasks.guards();
  f.env.GITHUB_HEAD_REF = "main";
  assert.throws(() => f.tasks.guards(), /feature branch/);
  f.env.GITHUB_HEAD_REF = "chore/P0-02-development-tooling";
  f.tasks.guards();
  f.state.versionSuffix = "0";
  assert.throws(() => f.tasks.doctor(), /go pin mismatch/);
  f.state.versionSuffix = "";
  f.state.missing = true;
  assert.throws(() => f.tasks.doctor(), /missing scanner/);
  f.state.missing = false;
  f.env.GITHUB_EVENT_NAME = "schedule";
  f.tasks.check();
  assert.ok(f.output.some((line) => line.startsWith("N/A scope/test guards:")));
});

test("untracked files participate in both scope and coverage gates", (t) => {
  const f = fixture(t);
  f.state.untracked = "outside/untracked.mjs";
  f.write(f.state.untracked, "export const missed = true;\n");
  assert.throws(() => f.tasks.guards(), /Out of scope/);
  f.state.untracked = "tools/untracked.mjs";
  f.write(f.state.untracked, "export const missed = true;\n");
  f.tasks.guards();
  assert.throws(() => f.tasks.coverage(), /Missing coverage/);
});

test("tasks fail closed on formatting, pins, coverage and protected branches", (t) => {
  const f = fixture(t);
  f.state.badFormat = true;
  assert.throws(() => f.tasks.check(), /formatting/);
  f.state.badFormat = false;
  f.state.branch = "main";
  assert.throws(() => f.tasks.protect());
  f.state.branch = "chore/P0-02-development-tooling";
  f.state.testChange = true;
  assert.throws(() => f.tasks.guards(), /explicit test scope/);
  f.state.testChange = false;
  f.state.main = true;
  f.tasks.guards();
  f.write("node_modules/example/package.json", JSON.stringify({ version: "0.0.0" }));
  assert.throws(() => f.tasks.doctor(), /Dependency pin mismatch/);
  f.write("node_modules/example/package.json", JSON.stringify({ version: "1.0.0" }));
  f.write("tools/toolchain.json", JSON.stringify({ ...f.pins, node: "0.0.0" }));
  assert.throws(() => f.tasks.doctor(), /Node/);
  f.write("tools/toolchain.json", JSON.stringify({ ...f.pins, npm: "0.0.0" }));
  assert.throws(() => f.tasks.doctor(), /npm/);
  f.write("tools/toolchain.json", JSON.stringify(f.pins));
  f.write("coverage/js/coverage-final.json", "{}");
  assert.throws(() => f.tasks.coverage(), /Missing coverage/);
  f.write("docs/BLUEPRINT.md", "P0-01 — First — PR #1");
  f.tasks.brief();
  assert.ok(f.output.includes("No dependency-ready open item."));
});

test("runner passes arguments without a shell and propagates process failures", (t) => {
  const f = fixture(t);
  const run = runner(f.root);
  assert.equal(
    run(process.execPath, ["-e", "process.stdout.write(process.argv[1])", "literal;$text"], true),
    "literal;$text",
  );
  assert.throws(() => run(process.execPath, ["-e", "process.exit(7)"], true), /failed \(7\)/);
  assert.throws(() => run("nonexistent-tessera-command", [], true), /failed/);
  assert.equal(run(process.execPath, ["-e", ""], false), "");
});
