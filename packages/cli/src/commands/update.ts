import type { Command } from "../command.ts";
import { applyPlan, assertAgentBlockWellFormed, isLocalChange, planFiles, pruneOrphans, writeAgentBlock, writeConfig, type PlannedFile } from "../project.ts";
import { loadRegistry } from "../registry.ts";
import { requireConfig } from "../command.ts";
import type { RegistryFile, Written } from "../schema.ts";

export const update: Command = async ({ cwd, args, flags }) => {
  const config = requireConfig(cwd);
  assertAgentBlockWellFormed(cwd);
  const registry = await loadRegistry(flags.registry ?? config.registry);
  const names = args.length ? args : Object.keys(config.installed).sort();
  for (const name of names) {
    if (!config.installed[name]) throw new Error(`"${name}" is not installed; use \`paper add ${name}\``);
  }
  // A component removed upstream is left as is: there is nothing to update it to, and --force cannot change that.
  const missing = names.filter((name) => !registry.components.some((c) => c.name === name));
  const skip = (f: PlannedFile) => isLocalChange(f) && !flags.force;
  const all: PlannedFile[] = [];
  const removed: string[] = [];
  const kept: string[] = [];
  const sync = (record: Written, files: RegistryFile[]): Written => {
    const plan = planFiles(cwd, config, record, files);
    all.push(...plan);
    const pruned = pruneOrphans(cwd, applyPlan(cwd, record, plan, skip), plan, flags.force);
    removed.push(...pruned.removed);
    kept.push(...pruned.kept);
    return pruned.record;
  };
  const installed = { ...config.installed };
  for (const name of names.filter((n) => !missing.includes(n))) {
    installed[name] = sync(installed[name], registry.components.find((c) => c.name === name)!.files);
  }
  const tokens = args.length ? config.tokens : sync(config.tokens, registry.tokens);
  const next = { ...config, installed, tokens };
  writeConfig(cwd, next);
  const agentFile = writeAgentBlock(cwd, next, registry);

  const paths = (pred: (f: PlannedFile) => boolean) => all.filter(pred).map((f) => f.path);
  const skipped = [...paths(skip), ...kept];
  const updated = paths((f) => !skip(f) && f.status !== "unchanged");
  const unchanged = paths((f) => f.status === "unchanged");
  const list = (label: string, items: string[]) => (items.length ? `${label}: ${items.join(", ")}` : "");
  const text = [
    `updated: ${updated.join(", ") || "none"}`,
    `unchanged: ${unchanged.length} file(s)`,
    list("removed (no longer in the registry)", removed),
    list("skipped (locally modified)", paths((f) => skip(f) && f.status === "modified")),
    list("skipped (deleted locally)", paths((f) => skip(f) && f.status === "deleted")),
    list("skipped (locally modified, no longer in the registry)", kept),
    skipped.length ? "review them, then rerun with --force to overwrite, restore or delete them" : "",
    missing.length ? `skipped (missing from the registry): ${missing.join(", ")}\ndelete their files and paper.json entries, or pass --registry with one that has them` : "",
    `rewrote the paper block in ${agentFile}`,
  ].filter(Boolean);
  return { exitCode: skipped.length || missing.length ? 1 : 0, json: { updated, unchanged, skipped, removed, missing, agentFile }, text: text.join("\n") };
};
