import type { Command } from "../command.ts";
import { applyPlan, assertAgentBlockWellFormed, assertNoConflicts, planFiles, readConfig, writeAgentBlock, writeConfig } from "../project.ts";
import { DEFAULT_REGISTRY, loadRegistry } from "../registry.ts";

export const init: Command = async ({ cwd, flags }) => {
  const existing = readConfig(cwd);
  const config = {
    registry: flags.registry ?? existing?.registry ?? DEFAULT_REGISTRY,
    componentsDir: flags.dir ?? existing?.componentsDir ?? "src/components/paper",
    installed: existing?.installed ?? {},
    tokens: existing?.tokens ?? { files: {} },
  };
  assertAgentBlockWellFormed(cwd);
  const registry = await loadRegistry(config.registry);
  const plan = planFiles(cwd, config, config.tokens, registry.tokens);
  assertNoConflicts(plan, flags.force);
  const next = { ...config, tokens: applyPlan(cwd, config.tokens, plan, () => false) };
  writeConfig(cwd, next);
  const agentFile = writeAgentBlock(cwd, next, registry);
  const tokens = plan.map((f) => f.path);
  return {
    json: { config: "paper.json", tokens, agentFile },
    text: [`wrote paper.json, ${tokens.join(", ")}, ${agentFile} (paper section)`, "requires: @stylexjs/stylex and a StyleX bundler plugin (e.g. @stylexjs/unplugin)"].join("\n"),
  };
};
