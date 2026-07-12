#!/usr/bin/env node
// Defensive fallback, not the primary fix: on Windows, pnpm/npm run
// package.json scripts through an intermediate cmd.exe, and nest-cli forks
// its own hot-reload child on top of that — so the PID a caller can see is
// never the actual worker. nest-cli already does the right thing on its own
// (lib/utils/tree-kill.js runs `taskkill /pid <pid> /T /F` from a
// `process.on('exit', ...)` hook), but that only fires on *graceful*
// termination. A forceful kill of the top-level process (Stop-Process
// -Force, taskkill without /T, a task runner's force-stop) bypasses that
// entirely and orphans the real process holding the port. The actual fix is
// to always tree-kill when stopping these dev servers programmatically;
// this hook just self-heals if something upstream didn't.
const { execSync } = require('child_process');

const port = process.argv[2];
if (!port) {
  console.error('Usage: free-port.js <port>');
  process.exit(0);
}

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

try {
  if (process.platform === 'win32') {
    const out = run(
      `powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue).OwningProcess"`,
    ).trim();
    const pids = [...new Set(out.split(/\s+/).filter(Boolean))];
    for (const pid of pids) {
      try {
        // /T kills the process's own subtree too (e.g. a compiler worker it
        // spawned) — matches what nest-cli's own tree-kill does on a clean exit.
        run(`taskkill /pid ${pid} /T /F`);
        console.log(`[free-port] tree-killed stale process ${pid} on port ${port}`);
      } catch {
        // Already gone between the check and the kill — fine.
      }
    }
  } else {
    const out = run(`lsof -ti tcp:${port}`).trim();
    for (const pid of out.split('\n').filter(Boolean)) {
      try {
        run(`kill -9 ${pid}`);
        console.log(`[free-port] killed stale process ${pid} on port ${port}`);
      } catch {
        // Already gone between the check and the kill — fine.
      }
    }
  }
} catch {
  // Nothing listening on the port — nothing to clean up.
}
