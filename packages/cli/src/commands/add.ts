import type { Command } from "../command.ts";
import { applyPlan, assertNoConflicts, planFiles, writeAgentBlock, writeConfig } from "../project.ts";
import { loadRegistry } from "../registry.ts";
import { requireConfig, UsageError } from "../command.ts";

export const add: Command = async ({ cwd, args, flags }) => {
  if (!args.length) throw new UsageError("usage: paper add <name...>");
  const config = requireConfig(cwd);
  const registry = await loadRegistry(flags.registry ?? config.registry);
  const entries = args.map((name) => {
    const entry = registry.components.find((c) => c.name === name);
    if (!entry) throw new Error(`unknown component "${name}". Available: ${registry.components.map((c) => c.name).join(", ")}`);
    return entry;
  });
  const empty = { files: {} };
  const plans = entries.map((e) => ({ name: e.name, plan: planFiles(cwd, config, config.installed[e.name] ?? empty, e.files) }));
  assertNoConflicts(plans.flatMap((p) => p.plan), flags.force);
  const installed = { ...config.installed };
  for (const { name, plan } of plans) installed[name] = applyPlan(cwd, installed[name] ?? empty, plan, () => false);
  const next = { ...config, installed };
  writeConfig(cwd, next);
  writeAgentBlock(cwd, next, registry);
  const files = plans.flatMap((p) => p.plan.map((f) => f.path));
  const dependencies = [...new Set(entries.flatMap((e) => e.dependencies))].sort();
  return {
    json: { added: args, files, dependencies },
    text: [`added ${args.join(", ")}: ${files.join(", ")}`, dependencies.length ? `dependencies: ${dependencies.join(" ")}` : ""].filter(Boolean).join("\n"),
  };
};
