import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { runRules } from "../../../../registry/rules/index.ts";
import type { Command } from "../command.ts";
import { agentBlock, agentFile, readAgentBlock, readConfig } from "../project.ts";
import { loadRegistry } from "../registry.ts";

const SKIP = new Set(["node_modules", ".git", "dist", "build", ".next", "coverage"]);
const SOURCE = /\.(tsx?|jsx?|css)$/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? (SKIP.has(d.name) ? [] : sourceFiles(join(dir, d.name))) : SOURCE.test(d.name) ? [join(dir, d.name)] : [],
  );
}

/** "stale" when the paper block differs from what the registry and paper.json would generate now. */
async function agentBlockStatus(cwd: string, registryFlag: string | undefined): Promise<"ok" | "stale" | "missing" | undefined> {
  const config = readConfig(cwd);
  if (!config) return undefined;
  const current = readAgentBlock(cwd);
  if (current === undefined) return "missing";
  return current === agentBlock(config, await loadRegistry(registryFlag ?? config.registry)) ? "ok" : "stale";
}

export const check: Command = async ({ cwd, flags }) => {
  const violations = sourceFiles(cwd).flatMap((f) => runRules(relative(cwd, f), readFileSync(f, "utf8")));
  const block = await agentBlockStatus(cwd, flags.registry);
  const blockBad = block === "stale" || block === "missing";
  const lines = violations.map((v) => `${v.file}:${v.line} ${v.rule} ${v.message}`);
  if (violations.length) lines.push(`${violations.length} violation(s)`);
  if (blockBad) lines.push(`${agentFile(cwd)}: paper block is ${block}; run \`paper update\``);
  const ok = !violations.length && !blockBad;
  return {
    exitCode: ok ? 0 : 1,
    json: { ok, violations, ...(block && { agentBlock: block }) },
    text: ok ? "paper check: no violations" : lines.join("\n"),
  };
};
