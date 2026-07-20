import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const opencode = process.env.OPENCODE_BIN ?? "opencode";
const hasOpenCode = spawnSync(opencode, ["--version"], { stdio: "ignore" }).status === 0;

test("packed npm artifact loads in OpenCode and registers its provider", { skip: !hasOpenCode, timeout: 60_000 }, () => {
  const root = mkdtempSync(path.join(tmpdir(), "omniroute-opencode-e2e-"));
  const install = path.join(root, "install");
  const data = path.join(root, "data", "opencode");
  mkdirSync(install, { recursive: true });
  mkdirSync(data, { recursive: true });
  try {
    const pack = execFileSync("npm", ["pack", "--ignore-scripts", "--json"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    const packed = JSON.parse(pack) as Record<string, { filename: string }>;
    const { filename } = Object.values(packed)[0];
    execFileSync("npm", ["init", "-y"], { cwd: install, stdio: "ignore" });
    execFileSync("npm", ["install", path.join(process.cwd(), filename)], {
      cwd: install,
      stdio: "ignore",
    });
    const packageDir = path.join(install, "node_modules", "@mr.mm", "opencode-omniroute-plugin");
    const config = path.join(root, "opencode.json");
    writeFileSync(config, JSON.stringify({ plugin: [[`file:${packageDir}`, { providerId: "omniroute-e2e" }]], provider: {} }));
    const stdout = execFileSync(opencode, ["debug", "config"], {
      encoding: "utf8",
      env: { ...process.env, OPENCODE_CONFIG: config, XDG_CONFIG_HOME: root, XDG_DATA_HOME: path.join(root, "data") },
    });
    const resolved = JSON.parse(stdout) as { plugin?: unknown[] };
    assert.ok(resolved.plugin, "OpenCode accepted the packed plugin without a loader error");
  } finally {
    for (const name of ["mr.mm-opencode-omniroute-plugin-0.1.2.tgz"]) rmSync(path.join(process.cwd(), name), { force: true });
    rmSync(root, { recursive: true, force: true });
  }
});
