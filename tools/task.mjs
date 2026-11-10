import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  parseBlueprint,
  nextItem,
  assertFeatureBranch,
  guardChanges,
  isTest,
  changedLines,
  checkCoverage,
  validCommit,
  validateDocuments,
} from "./lib.mjs";

/** @typedef {(command:string,args:string[],capture?:boolean)=>string} Runner */

/** @param {string} root @returns {Runner} */
export function runner(root) {
  return (command, args, capture = false) => {
    const env = {
      ...process.env,
      GOCACHE: join(root, ".cache/go-build"),
      GOMODCACHE: join(root, ".cache/go-mod"),
      TRIVY_CACHE_DIR: join(root, ".cache/trivy"),
      // Public vulnerability databases never need the developer's Docker credentials.
      DOCKER_CONFIG: join(root, ".cache/docker-public"),
    };
    mkdirSync(env.DOCKER_CONFIG, { recursive: true });
    const result = spawnSync(command, args, {
      cwd: root,
      env,
      encoding: "utf8",
      shell: false,
      stdio: capture ? "pipe" : "inherit",
      maxBuffer: 32 * 1024 * 1024,
    });
    if (result.error || result.status !== 0)
      throw new Error(
        `${command} failed${result.status === null ? "" : ` (${result.status})`}${capture ? ": " + (result.stderr ?? "").trim() : ""}`,
      );
    return result.stdout?.trim() ?? "";
  };
}

/** @param {string} root @param {Runner} run @param {(text:string)=>void} log @param {NodeJS.ProcessEnv} env */
export function createTasks(root, run = runner(root), log = console.log, env = process.env) {
  /** @param {string} file */ const read = (file) => readFileSync(join(root, file), "utf8");
  /** @param {string[]} args */ const git = (args) => run("git", args, true);
  /** @param {string} text */ const split = (text) => text.split("\0").filter(Boolean);
  const files = () =>
    [...new Set(split(git(["ls-files", "-z", "--cached", "--others", "--exclude-standard"])))]
      .filter((file) => existsSync(join(root, file)))
      .sort();
  const branch = () => env.GITHUB_HEAD_REF || git(["branch", "--show-current"]);
  const blueprint = () => parseBlueprint(read("docs/BLUEPRINT.md"));
  const base = () => {
    if (env.TESSERA_BASE) {
      if (!/^[a-f0-9]{40}$/.test(env.TESSERA_BASE)) throw new Error("TESSERA_BASE must be a full commit SHA");
      return git(["rev-parse", "--verify", env.TESSERA_BASE + "^{commit}"]);
    }
    for (const ref of ["refs/remotes/origin/main", "refs/heads/main"]) {
      try {
        git(["rev-parse", "--verify", ref]);
        return git(["merge-base", "HEAD", ref]);
      } catch {
        /* Bootstrap has no main yet. */
      }
    }
    return git(["rev-list", "--max-parents=0", "HEAD"]).split("\n")[0] ?? "";
  };
  const goPackages = () => [
    ...new Set(
      files()
        .filter((file) => file.endsWith(".go"))
        .map((file) => "./" + file.split("/")[0] + "/..."),
    ),
  ];
  /** @param {string} name */ const scanner = (name) =>
    join(root, ".tools", name + (process.platform === "win32" ? ".exe" : ""));
  /** @param {string} module @param {string[]} args */ const node = (module, args) =>
    run(process.execPath, [join(root, "node_modules", module), ...args]);
  const documents = () =>
    validateDocuments(
      new Map(
        files()
          .filter((file) => file.endsWith(".md") && !file.startsWith(".github/"))
          .map((file) => [file, read(file)]),
      ),
    );
  const changes = () => {
    const ref = base();
    const tracked = split(git(["diff", "--name-only", "--no-renames", "-z", ref, "--"]));
    const untracked = split(git(["ls-files", "--others", "--exclude-standard", "-z"]));
    const modified = split(git(["diff", "--name-only", "--no-renames", "--diff-filter=MD", "-z", ref, "--"])).filter(
      isTest,
    );
    return { ref, changed: [...new Set([...tracked, ...untracked])], untracked, modified };
  };
  const guards = () => {
    const { changed, modified } = changes();
    guardChanges(blueprint(), branch(), changed, modified);
    log("PASS scope gate; PASS test guard");
  };
  const coverage = () => {
    const { ref, untracked } = changes();
    const changed = changedLines(git(["diff", "--no-ext-diff", "--unified=0", "--no-renames", ref, "--"]));
    for (const file of untracked)
      changed.set(
        file,
        new Set(
          read(file)
            .split("\n")
            .map((_, i) => i + 1),
        ),
      );
    /** @type {Map<string,Map<number,boolean>>} */ const evidence = new Map();
    /** @typedef {{path:string, statementMap:Record<string,{start:{line:number},end:{line:number}}>,s:Record<string,number>}} JSFile */
    const js = /** @type {Record<string,JSFile>} */ (JSON.parse(read("coverage/js/coverage-final.json")));
    for (const value of Object.values(js)) {
      const file = relative(root, value.path).replaceAll("\\", "/");
      const lines = new Map();
      for (const [id, statement] of Object.entries(value.statementMap)) {
        for (let n = statement.start.line; n <= statement.end.line; n++)
          lines.set(n, (lines.get(n) ?? true) && (value.s[id] ?? 0) > 0);
      }
      evidence.set(file, lines);
    }
    for (const line of read("coverage/go.out").split("\n").slice(1)) {
      const match = /^tessera\.local\/tessera\/(.+):(\d+)\.\d+,(\d+)\.\d+ \d+ (\d+)$/.exec(line);
      if (!match?.[1]) continue;
      const measured = evidence.get(match[1]) ?? new Map();
      for (let n = Number(match[2]); n <= Number(match[3]); n++)
        measured.set(n, (measured.get(n) ?? true) && Number(match[4]) > 0);
      evidence.set(match[1], measured);
    }
    log(`PASS changed executable-line coverage ${checkCoverage(changed, evidence).toFixed(2)}%`);
  };
  const doctor = () => {
    const pins =
      /** @type {{node:string,npm:string,go:string,just:string,scanners:Record<string,{version:string}>}} */ (
        JSON.parse(read("tools/toolchain.json"))
      );
    if (process.versions.node !== pins.node) throw new Error(`Node ${pins.node} required`);
    for (const [command, args, want] of /** @type {[string,string[],string][]} */ ([
      ["go", ["version"], `go${pins.go}`],
      ["just", ["--version"], pins.just],
    ])) {
      if (!run(command, args, true).split(/\s+/).includes(want)) throw new Error(`${command} pin mismatch`);
    }
    const npmRoot =
      process.platform === "win32"
        ? join(process.execPath, "..", "node_modules/npm/package.json")
        : join(process.execPath, "..", "..", "lib/node_modules/npm/package.json");
    const npm = /** @type {{version:string}} */ (JSON.parse(readFileSync(npmRoot, "utf8")));
    if (npm.version !== pins.npm) throw new Error("npm pin mismatch");
    const pkg = /** @type {{devDependencies:Record<string,string>}} */ (JSON.parse(read("package.json")));
    for (const [name, version] of Object.entries(pkg.devDependencies)) {
      const installed = /** @type {{version:string}} */ (JSON.parse(read(`node_modules/${name}/package.json`)));
      if (installed.version !== version) throw new Error(`Dependency pin mismatch: ${name}`);
    }
    for (const [name, pin] of Object.entries(pins.scanners)) {
      const args = name === "gitleaks" ? ["version"] : name === "gosec" ? ["-version"] : ["--version"];
      if (
        !run(scanner(name), args, true)
          .split(/\s+/)
          .some((word) => word === pin.version || word === "v" + pin.version)
      )
        throw new Error(`${name} pin mismatch; run bootstrap`);
    }
    log("PASS doctor: pinned toolchain and scanners");
  };
  const fmt = () => {
    node("prettier/bin/prettier.cjs", ["--write", "."]);
    const go = files().filter((file) => file.endsWith(".go"));
    if (go.length) run("gofmt", ["-w", ...go]);
  };
  const check = () => {
    doctor();
    documents();
    mkdirSync(join(root, "coverage/js"), { recursive: true });
    node("prettier/bin/prettier.cjs", ["--check", "."]);
    const go = files().filter((file) => file.endsWith(".go"));
    if (go.length && run("gofmt", ["-l", ...go], true).trim()) throw new Error("Go formatting differs");
    node("eslint/bin/eslint.js", ["."]);
    const packages = goPackages();
    if (packages.length) run("go", ["vet", ...packages]);
    node("typescript/bin/tsc", ["--noEmit"]);
    if (packages.length) run("go", ["build", ...packages]);
    node("c8/bin/c8.js", [
      "--all",
      "--include=tools/**/*.mjs",
      "--exclude=tests/**",
      "--reporter=json",
      "--reporter=text",
      "--reports-dir=coverage/js",
      process.execPath,
      "--test",
      ...files().filter((file) => file.startsWith("tests/tooling/") && file.endsWith(".test.mjs")),
    ]);
    if (packages.length) run("go", ["test", "-coverprofile=coverage/go.out", ...packages]);
    // The race detector needs a C compiler; CI provides one on Linux.
    if (process.platform !== "win32" && packages.length) run("go", ["test", "-race", ...packages]);
    coverage();
    run(scanner("gitleaks"), [
      "dir",
      ".",
      "--config",
      "tools/gitleaks.toml",
      "--redact",
      "--no-banner",
      "--exit-code=1",
    ]);
    run(scanner("trivy"), [
      "fs",
      "--scanners",
      "vuln",
      "--include-dev-deps",
      "--severity",
      "UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL",
      "--exit-code",
      "1",
      "--skip-dirs",
      ".tools",
      "--skip-dirs",
      ".cache",
      "--skip-dirs",
      "node_modules",
      "--skip-dirs",
      "coverage",
      ".",
    ]);
    if (packages.length) run(scanner("gosec"), ["-quiet", ...packages]);
    if (env.GITHUB_EVENT_NAME === "schedule") log("N/A scope/test guards: scheduled baseline has no proposed diff");
    else guards();
    log("PASS check: format, lint, types, tests, coverage, secrets, dependencies, SAST, scope, test guard");
  };
  return {
    doctor,
    fmt,
    check,
    guards,
    coverage,
    protect: () => {
      assertFeatureBranch(branch());
    },
    brief: () => {
      log(read("docs/HANDOFF.md"));
      log(nextItem(blueprint())?.text ?? "No dependency-ready open item.");
    },
    map: () => {
      for (const file of files()) {
        log(file);
        if (/\.(go|mjs|ts|tsx)$/.test(file))
          for (const line of read(file).split("\n"))
            if (
              /^(?:export (?:async )?(?:function|class|const|type|interface)|func (?:\([^)]*\) )?[A-Z]|type [A-Z])/.test(
                line,
              )
            )
              log("  " + line.trim());
      }
    },
    /** @param {string} file */
    commitMessage: (file) => {
      if (!validCommit(readFileSync(file, "utf8"))) throw new Error("Conventional Commit message required");
    },
  };
}

/** @param {string[]} args @param {ReturnType<typeof createTasks>} tasks */
export function dispatch(args, tasks) {
  const command = args[0];
  if (command === "commit-message" && args[1]) return tasks.commitMessage(args[1]);
  if (
    command === "doctor" ||
    command === "check" ||
    command === "fmt" ||
    command === "brief" ||
    command === "map" ||
    command === "protect" ||
    command === "guards" ||
    command === "coverage"
  )
    return tasks[command]();
  throw new Error("Use doctor, check, fmt, brief or map");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    dispatch(process.argv.slice(2), createTasks(process.cwd()));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Task failed");
    process.exitCode = 1;
  }
}
