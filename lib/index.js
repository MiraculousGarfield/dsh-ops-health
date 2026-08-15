// dsh-ops-health host half: one plain HTTP route that runs the ops kit's
// check-health.ps1 (hidden window) and returns a structured JSON report.
//
// Deliberately decoupled from the tool registry: this route is registered on
// the webServer directly, so it keeps working when agent tool calls break
// (the tool-prepare crash class) — exactly the incident this kit exists for.
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const name = "ops-health";
const inject = ["webServer"];

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts", "check-health.ps1");
const PROFILE = process.env.DSH_OPS_PROFILE || "web";
const PORT = Number(process.env.DSH_OPS_PORT || 3080);
const TIMEOUT_MS = 60000;

/** Run check-health.ps1 once, hidden, and parse its [OK]/[FAIL] lines. */
function runHealthCheck() {
  return new Promise((resolve) => {
    const child = spawn("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy", "Bypass",
      "-File", SCRIPT,
      "-Profile", PROFILE,
      "-Port", String(PORT),
    ], { windowsHide: true });
    let out = "";
    let err = "";
    const timer = setTimeout(() => { try { child.kill(); } catch {} }, TIMEOUT_MS);
    child.stdout.on("data", (d) => { out += d.toString("utf8"); });
    child.stderr.on("data", (d) => { err += d.toString("utf8"); });
    child.on("error", (e) => {
      clearTimeout(timer);
      resolve({ ok: false, error: "无法启动 PowerShell: " + e.message });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      const items = [];
      let summary = "";
      for (const raw of out.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line) continue;
        if (line.startsWith("[OK]")) items.push({ level: "ok", text: line.slice(4).trim() });
        else if (line.startsWith("[FAIL]")) items.push({ level: "fail", text: line.slice(6).trim() });
        else if (line.startsWith("RESULT:")) summary = line.slice(7).trim();
        else if (line.startsWith("==")) items.unshift({ level: "meta", text: line.replace(/^=+\s*|\s*=+$/g, "") });
      }
      resolve({
        ok: true,
        items,
        summary,
        healthy: summary === "ALL HEALTHY",
        exitCode: typeof code === "number" ? code : -1,
        stderr: err.trim().slice(0, 500),
      });
    });
  });
}

function apply(ctx) {
  ctx.effect(() =>
    ctx.webServer.register({
      kind: "exact",
      path: "/ops/health",
      handler: async (_req, res) => {
        try {
          const result = await runHealthCheck();
          res.writeHead(200, {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
          });
          res.end(JSON.stringify(result));
        } catch (e) {
          res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ ok: false, error: String((e && e.message) || e) }));
        }
      },
    })
  );
}

export { apply, inject, name };
