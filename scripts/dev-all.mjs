import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const serverDir = path.join(rootDir, "server");

const children = [];
let isShuttingDown = false;
let remainingChildren = 0;
let finalExitCode = 0;

function killChild(child) {
  if (!child.pid) {
    return;
  }

  if (process.platform === "win32") {
    const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
    });

    killer.on("error", () => {
      child.kill();
    });

    return;
  }

  child.kill("SIGTERM");

  setTimeout(() => {
    if (!child.killed) {
      child.kill("SIGKILL");
    }
  }, 5_000).unref();
}

function shutdown(exitCode = 0) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  finalExitCode = exitCode;

  for (const { child } of children) {
    killChild(child);
  }

  if (remainingChildren === 0) {
    process.exit(finalExitCode);
  }
}

function startProcess(name, cwd) {
  const child =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", "npm run dev"], {
          cwd,
          env: process.env,
          stdio: "inherit",
        })
      : spawn("npm", ["run", "dev"], {
          cwd,
          env: process.env,
          stdio: "inherit",
        });

  children.push({ name, child });
  remainingChildren += 1;

  child.on("error", (error) => {
    console.error(`[dev:all] Failed to start ${name}:`, error.message);
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    remainingChildren -= 1;

    if (!isShuttingDown) {
      if (signal) {
        console.error(`[dev:all] ${name} exited with signal ${signal}.`);
        shutdown(1);
      } else if (code && code !== 0) {
        console.error(`[dev:all] ${name} exited with code ${code}.`);
        shutdown(code);
      } else {
        console.log(`[dev:all] ${name} stopped. Shutting down remaining processes.`);
        shutdown(0);
      }
      return;
    }

    if (remainingChildren === 0) {
      process.exit(finalExitCode);
    }
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("[dev:all] Starting frontend and backend dev servers...");
startProcess("frontend", rootDir);
startProcess("backend", serverDir);
