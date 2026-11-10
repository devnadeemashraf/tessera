import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { artifactFor, verifyArchive } from "../../tools/bootstrap.mjs";
import { bootstrap } from "../../tools/bootstrap.mjs";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

test("scanner artifacts require pinned checksums and supported HTTPS source", () => {
  const bytes = Buffer.from("synthetic archive");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  assert.doesNotThrow(() => verifyArchive(bytes, sha256));
  assert.throws(() => verifyArchive(Buffer.from("changed"), sha256));
  assert.throws(() => verifyArchive(bytes, "not-a-checksum"));
  const scanner = {
    version: "1",
    base: "https://github.com/example/tool/releases/download/v1/",
    "win32-x64": { file: "tool.zip", sha256 },
    "linux-x64": { file: "tool.tar.gz", sha256 },
  };
  assert.equal(artifactFor(scanner, "linux-x64").file, "tool.tar.gz");
  assert.equal(artifactFor(scanner, "win32-x64").file, "tool.zip");
  assert.throws(() => artifactFor(scanner, "darwin-arm64"));
  assert.throws(() => artifactFor({ ...scanner, base: "http://untrusted.invalid/" }, "linux-x64"));
  assert.throws(() => artifactFor({ ...scanner, "linux-x64": { file: "../bad", sha256 } }, "linux-x64"));
});

test("bootstrap verifies cached and downloaded archives before extracting executable", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "tessera-bootstrap-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "tools"));
  mkdirSync(join(root, ".tools", "downloads", "probe"), { recursive: true });
  const archive = join(root, ".tools", "downloads", "probe", "probe.tar.gz");
  writeFileSync(join(root, "probe"), "synthetic executable");
  const packed = spawnSync("tar", ["-czf", archive, "-C", root, "probe"]);
  assert.equal(packed.status, 0);
  const bytes = readFileSync(archive);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const scanner = {
    version: "1",
    base: "https://github.com/example/tool/releases/download/v1/",
    "win32-x64": { file: "probe.tar.gz", sha256 },
    "linux-x64": { file: "probe.tar.gz", sha256 },
  };
  writeFileSync(join(root, "tools/toolchain.json"), JSON.stringify({ scanners: { probe: scanner } }));
  // A cached archive needs no network and still undergoes hash verification.
  await bootstrap(root, "linux-x64");
  assert.equal(readFileSync(join(root, ".tools", "probe"), "utf8"), "synthetic executable");
  rmSync(archive);
  const fetchMock = t.mock.method(globalThis, "fetch", async () => new Response(bytes));
  await bootstrap(root, "linux-x64");
  assert.equal(fetchMock.mock.callCount(), 1);
  rmSync(archive);
  fetchMock.mock.mockImplementation(async () => new Response("unavailable", { status: 503 }));
  await assert.rejects(bootstrap(root, "linux-x64"), /HTTP 503/);
  fetchMock.mock.mockImplementation(async () => new Response("tampered"));
  await assert.rejects(bootstrap(root, "linux-x64"), /checksum mismatch/);
});
