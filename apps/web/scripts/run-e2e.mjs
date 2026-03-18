import http from "node:http";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDir = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(webDir, "..", "..");
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const activeChildren = [];

function quoteShellArg(arg) {
  if (!/[\s"]/u.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/"/g, '\\"')}"`;
}

function spawnCommand(command, args, options) {
  if (process.platform === "win32") {
    const commandLine = [command, ...args].map(quoteShellArg).join(" ");
    return spawn(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", commandLine], {
      ...options,
      windowsHide: true,
    });
  }

  return spawn(command, args, options);
}

function relayOutput(child, label) {
  child.stdout?.on("data", (chunk) => {
    process.stdout.write(`[${label}] ${chunk}`);
  });
  child.stderr?.on("data", (chunk) => {
    process.stderr.write(`[${label}] ${chunk}`);
  });
}

function spawnProcess(label, args, extraEnv = {}) {
  const child = spawnCommand(pnpmCommand, args, {
    cwd: webDir,
    env: {
      ...process.env,
      ...extraEnv,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  relayOutput(child, label);
  activeChildren.push(child);
  return child;
}

function stopChild(child) {
  if (!child.pid) {
    return;
  }

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
    });
    return;
  }

  child.kill("SIGTERM");
}

function cleanupChildren() {
  while (activeChildren.length > 0) {
    const child = activeChildren.pop();
    if (child) {
      stopChild(child);
    }
  }
}

async function waitForHttpOk(url, label, child, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`${label} exited before becoming ready (code ${child.exitCode ?? "unknown"})`);
    }

    try {
      const statusCode = await new Promise((resolve, reject) => {
        const request = http.get(url, (response) => {
          response.resume();
          resolve(response.statusCode ?? 0);
        });

        request.on("error", reject);
      });

      if (statusCode >= 200 && statusCode < 400) {
        return;
      }
    } catch {
      // Keep polling until the timeout is reached.
    }

    await sleep(500);
  }

  throw new Error(`${label} did not become ready at ${url} within ${timeoutMs}ms`);
}

async function run() {
  const api = spawnProcess(
    "api",
    ["--dir", workspaceRoot, "--filter", "@xblog/api", "dev"],
    {
      API_PORT: "4100",
      API_BASE_URL: "http://127.0.0.1:4100",
    },
  );
  await waitForHttpOk("http://127.0.0.1:4100/api/health", "api", api);

  const web = spawnProcess(
    "web",
    ["--dir", workspaceRoot, "--filter", "@xblog/web", "exec", "next", "start", "-H", "127.0.0.1", "-p", "3100"],
    {
      XBLOG_API_URL: "http://127.0.0.1:4100",
    },
  );
  await waitForHttpOk("http://127.0.0.1:3100", "web", web);

  const testExitCode = await new Promise((resolve, reject) => {
    const child = spawnCommand(pnpmCommand, ["exec", "playwright", "test", "--config", "playwright.config.ts"], {
      cwd: webDir,
      stdio: "inherit",
      env: process.env,
    });

    child.on("exit", (code) => resolve(code ?? 1));
    child.on("error", reject);
  });

  if (testExitCode !== 0) {
    throw new Error(`Playwright exited with code ${testExitCode}`);
  }
}

try {
  await run();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  cleanupChildren();
}
