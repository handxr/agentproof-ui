import type { Command } from "../command.ts";
import { applyPlan, planFiles, writeAgentBlock, writeConfig, type PlannedFile } from "../project.ts";
import { loadRegistry } from "../registry.ts";
import { requireConfig } from "../command.ts";

export const update: Command = async ({ cwd, args, flags }) => {
  const config = requireConfig(cwd);
  const registry = await loadRegistry(flags.registry ?? config.registry);
  const names = args.length ? args : Object.keys(config.installed).sort();
  for (const name of names) {
    if (!config.installed[name]) throw new Error(`"${name}" is not installed; use \`paper add ${name}\``);
    if (!registry.components.some((c) => c.name === name)) throw new Error(`"${name}" is no longer in the registry`);
  }
  const skip = (f: PlannedFile) => f.status === "modified" && !flags.force;
  const all: PlannedFile[] = [];
  const installed = { ...config.installed };
  for (const name of names) {
    const entry = registry.components.find((c) => c.name === name)!;
    const plan = planFiles(cwd, config, installed[name], entry.files);
    installed[name] = applyPlan(cwd, installed[name], plan, skip);
    all.push(...plan);
  }
  let tokens = config.tokens;
  if (!args.length) {
    const plan = planFiles(cwd, config, tokens, registry.tokens);
    tokens = applyPlan(cwd, tokens, plan, skip);
    all.push(...plan);
  }
  const next = { ...config, installed, tokens };
  writeConfig(cwd, next);
  const agentFile = writeAgentBlock(cwd, next, registry);

  const paths = (pred: (f: PlannedFile) => boolean) => all.filter(pred).map((f) => f.path);
  const skipped = paths(skip);
  const updated = paths((f) => !skip(f) && f.status !== "unchanged");
  const unchanged = paths((f) => f.status === "unchanged");
  const text = [
    `updated: ${updated.join(", ") || "none"}`,
    `unchanged: ${unchanged.length} file(s)`,
    skipped.length ? `skipped (locally modified): ${skipped.join(", ")}\nreview them, then rerun with --force to overwrite` : "",
    `rewrote the paper block in ${agentFile}`,
  ].filter(Boolean);
  return { exitCode: skipped.length ? 1 : 0, json: { updated, unchanged, skipped, agentFile }, text: text.join("\n") };
};
