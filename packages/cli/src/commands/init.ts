import type { Command } from "../command.ts";
import { readConfig, writeAgentBlock, writeConfig, writeFiles } from "../project.ts";
import { DEFAULT_REGISTRY, loadRegistry } from "../registry.ts";

export const init: Command = async ({ cwd, flags }) => {
  const existing = readConfig(cwd);
  const config = {
    registry: flags.registry ?? existing?.registry ?? DEFAULT_REGISTRY,
    componentsDir: flags.dir ?? existing?.componentsDir ?? "src/components/ds",
    installed: existing?.installed ?? [],
  };
  const registry = await loadRegistry(config.registry);
  writeConfig(cwd, config);
  const tokens = writeFiles(cwd, config, registry.tokens);
  const agentFile = writeAgentBlock(cwd, config, registry);
  return {
    json: { config: "ds.json", tokens, agentFile },
    text: [`wrote ds.json, ${tokens.join(", ")}, ${agentFile} (ds section)`, "requires: @stylexjs/stylex and a StyleX bundler plugin (e.g. @stylexjs/unplugin)"].join("\n"),
  };
};
