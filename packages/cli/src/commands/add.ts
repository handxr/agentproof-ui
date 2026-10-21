import type { Command } from "../command.ts";
import { writeAgentBlock, writeConfig, writeFiles } from "../project.ts";
import { loadRegistry } from "../registry.ts";
import { requireConfig, UsageError } from "../command.ts";

export const add: Command = async ({ cwd, args, flags }) => {
  if (!args.length) throw new UsageError("usage: ds add <name...>");
  const config = requireConfig(cwd);
  const registry = await loadRegistry(flags.registry ?? config.registry);
  const entries = args.map((name) => {
    const entry = registry.components.find((c) => c.name === name);
    if (!entry) throw new Error(`unknown component "${name}". Available: ${registry.components.map((c) => c.name).join(", ")}`);
    return entry;
  });
  const next = { ...config, installed: [...new Set([...config.installed, ...args])].sort() };
  const files = entries.flatMap((e) => writeFiles(cwd, next, e.files));
  writeConfig(cwd, next);
  writeAgentBlock(cwd, next, registry);
  const dependencies = [...new Set(entries.flatMap((e) => e.dependencies))].sort();
  return {
    json: { added: args, files, dependencies },
    text: [`added ${args.join(", ")}: ${files.join(", ")}`, dependencies.length ? `dependencies: ${dependencies.join(" ")}` : ""].filter(Boolean).join("\n"),
  };
};
