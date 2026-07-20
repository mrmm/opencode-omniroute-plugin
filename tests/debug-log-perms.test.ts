import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

test("debug log and state artifacts are owner-only regardless of umask", (t) => {
  if (process.platform === "win32") {
    t.skip("file mode semantics are POSIX-only");
    return;
  }

  const home = fs.mkdtempSync(path.join(os.tmpdir(), "omniroute-debug-perms-"));
  try {
    const moduleUrl = new URL("../src/index.ts", import.meta.url).href;
    const script = `
      process.umask(0o022);
      const m = await import(${JSON.stringify(moduleUrl)});
      m.debugLogSetEnabled("perm-test", true);
      m.debugLogAppend({
        reqId: "req-1", providerId: "perm-test", ts: Date.now(),
        url: "https://or.example/v1/chat/completions", method: "POST",
        reqHeaders: {}, reqBody: { prompt: "sensitive" }, resStatus: 200,
        resHeaders: {}, resBody: { answer: "sensitive" }, durationMs: 1
      });
    `;
    const result = spawnSync(process.execPath, ["-e", script], {
      env: { ...process.env, HOME: home },
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);

    const dir = path.join(home, ".local", "share", "opencode", "plugins");
    const state = path.join(dir, "omniroute-debug-perm-test.state.json");
    const log = path.join(dir, "omniroute-debug-perm-test.jsonl");

    assert.equal(fs.statSync(dir).mode & 0o777, 0o700);
    assert.equal(fs.statSync(state).mode & 0o777, 0o600);
    assert.equal(fs.statSync(log).mode & 0o777, 0o600);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});
