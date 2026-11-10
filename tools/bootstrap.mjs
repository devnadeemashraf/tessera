import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, chmodSync, copyFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

/** @typedef {{file:string, sha256:string}} Artifact */
/** @typedef {{version:string, base:string, 'win32-x64':Artifact, 'linux-x64':Artifact}} Scanner */

/** @param {Uint8Array} bytes @param {string} expected */
export function verifyArchive(bytes, expected) {
  if (!/^[a-f0-9]{64}$/.test(expected) || createHash("sha256").update(bytes).digest("hex") !== expected)
    throw new Error("Scanner archive checksum mismatch");
}

/** @param {Scanner} scanner @param {string} platform */
export function artifactFor(scanner, platform) {
  if (platform !== "win32-x64" && platform !== "linux-x64")
    throw new Error(`Unsupported bootstrap platform: ${platform}; qualify it before adding a pin`);
  const artifact = scanner[platform];
  if (!artifact || !/^https:\/\/github\.com\//.test(scanner.base) || !/^[a-zA-Z0-9_.-]+$/.test(artifact.file))
    throw new Error("Unsafe scanner artifact");
  return artifact;
}

/** @param {string} command @param {string[]} args */
function execute(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.error || result.status !== 0) throw new Error(`Extraction failed: ${command}`);
}

/** @param {string} root @param {string} platform */
export async function bootstrap(root, platform) {
  const pins = /** @type {{scanners:Record<string,Scanner>}} */ (
    JSON.parse(readFileSync(join(root, "tools/toolchain.json"), "utf8"))
  );
  for (const [name, scanner] of Object.entries(pins.scanners)) {
    const artifact = artifactFor(scanner, platform);
    const target = join(root, ".tools", "downloads", name);
    mkdirSync(target, { recursive: true });
    const archive = join(target, artifact.file);
    let bytes;
    try {
      bytes = readFileSync(archive);
    } catch {
      const response = await fetch(scanner.base + artifact.file, { signal: AbortSignal.timeout(120000) });
      if (!response.ok) throw new Error(`Scanner download failed: ${name} HTTP ${response.status}`);
      bytes = new Uint8Array(await response.arrayBuffer());
    }
    verifyArchive(bytes, artifact.sha256);
    writeFileSync(archive, bytes);
    execute("tar", ["-xf", archive, "-C", target]);
    const executable = name + (platform.startsWith("win32") ? ".exe" : "");
    const destination = join(root, ".tools", executable);
    copyFileSync(join(target, executable), destination);
    chmodSync(destination, 0o755);
    console.log(`Verified ${name} ${scanner.version}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await bootstrap(process.cwd(), `${process.platform}-${process.arch}`);
}
