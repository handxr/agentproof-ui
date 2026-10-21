import type { Command } from "../command.ts";
import { readConfig } from "../project.ts";
import { DEFAULT_REGISTRY, loadRegistry } from "../registry.ts";

export const tokens: Command = async ({ cwd, flags }) => {
  const registry = await loadRegistry(flags.registry ?? readConfig(cwd)?.registry ?? DEFAULT_REGISTRY);
  const lines = Object.entries(registry.tokenValues).flatMap(([group, values]) =>
    Object.entries(values).map(([k, v]) => `${group}.${k} = ${typeof v === "string" ? v : `${v.light} (dark ${v.dark})`}`),
  );
  return { json: registry.tokenValues, text: lines.join("\n") };
};
