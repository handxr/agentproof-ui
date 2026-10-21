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
  }
  // A component removed upstream is left as is: there is nothing to update it to, and --force cannot change that.
  const missing = names.filter((name) => !registry.components.some((c) => c.name === name));
  const skip = (f: PlannedFile) => f.status === "modified" && !flags.force;
  const all: PlannedFile[] = [];
  const installed = { ...config.installed };
  for (const name of names.filter((n) => !missing.includes(n))) {
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
    missing.length ? `skipped (missing from the registry): ${missing.join(", ")}\ndelete their files and paper.json entries, or pass --registry with one that has them` : "",
    `rewrote the paper block in ${agentFile}`,
  ].filter(Boolean);
  return { exitCode: skipped.length || missing.length ? 1 : 0, json: { updated, unchanged, skipped, missing, agentFile }, text: text.join("\n") };
};
