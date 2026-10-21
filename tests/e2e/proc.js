import { spawnSync } from "node:child_process";
import { ROOT } from "./env.js";

const quote = (a) => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a);

/**
 * Runs a command in the project root. On Windows `npx` needs a shell, so the command
 * is passed as one quoted string (no args array with shell: true, which Node deprecates).
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ env: Record<string, string | undefined>, inherit?: boolean }} opts
 * @returns {import("node:child_process").SpawnSyncReturns<string>}
 */
export function runSync(cmd, args, { env, inherit = false }) {
  const common = { cwd: ROOT, env, encoding: "utf8", stdio: inherit ? "inherit" : "pipe" };
  if (process.platform === "win32") {
    return spawnSync([cmd, ...args].map(quote).join(" "), { ...common, shell: true });
  }
  return spawnSync(cmd, args, common);
}
