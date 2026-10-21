import type { Command } from "../command.ts";
import { readConfig } from "../project.ts";
import { DEFAULT_REGISTRY, loadRegistry } from "../registry.ts";

export const list: Command = async ({ cwd, flags }) => {
  const config = readConfig(cwd);
  const registry = await loadRegistry(flags.registry ?? config?.registry ?? DEFAULT_REGISTRY);
  const items = registry.components.map((c) => ({ name: c.name, summary: c.summary, installed: config?.installed.includes(c.name) ?? false }));
  return { json: items, text: items.map((i) => `${i.installed ? "*" : " "} ${i.name.padEnd(12)} ${i.summary}`).join("\n") };
};
