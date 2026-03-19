import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getDevCommand() {
  if (process.platform === "win32") {
    // Node 24 on Windows can throw EINVAL when spawning npm.cmd directly.
    return {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", "npm run dev"],
    };
  }

  return {
    command: "npm",
    args: ["run", "dev"],
  };
}

function startProcess(name, cwd) {
  const { command, args } = getDevCommand();

  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });

  child.on("error", (error) => {
    console.error(`[${name}] failed to start:`, error.message);
  });

  child.on("exit", (code, signal) => {
    const reason = signal ? `signal ${signal}` : `code ${code}`;
    console.log(`[${name}] exited with ${reason}`);

    if (!isShuttingDown) {
      isShuttingDown = true;
      stopAll(name);
      process.exit(code ?? 1);
    }
  });

  return child;
}

let isShuttingDown = false;

const frontend = startProcess("frontend", __dirname);
const backend = startProcess("backend", path.join(__dirname, "server"));

function stopAll(origin) {
  for (const proc of [frontend, backend]) {
    if (!proc.killed) {
      proc.kill("SIGINT");
    }
  }

  if (origin) {
    console.log(`Stopping remaining process after ${origin} shutdown...`);
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    stopAll("manual interrupt");
    process.exit(0);
  });
}
