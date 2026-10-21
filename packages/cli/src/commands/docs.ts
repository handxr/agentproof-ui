import type { Command } from "../command.ts";
import { readConfig } from "../project.ts";
import { DEFAULT_REGISTRY, loadRegistry } from "../registry.ts";
import { UsageError } from "../command.ts";

export const docs: Command = async ({ cwd, args, flags }) => {
  const [name] = args;
  if (!name) throw new UsageError("usage: paper docs <name>");
  const registry = await loadRegistry(flags.registry ?? readConfig(cwd)?.registry ?? DEFAULT_REGISTRY);
  const entry = registry.components.find((c) => c.name === name);
  if (!entry) throw new Error(`unknown component "${name}"`);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { files, ...doc } = entry;
  const props = doc.props.map((p) => `  ${p.name}${p.required ? "" : "?"}: ${p.type}${p.default ? ` = ${p.default}` : ""}  ${p.description}${p.note ? " " + p.note : ""}`);
  const text = [
    `${doc.name}: ${doc.summary}`, "",
    "use:", ...doc.use.map((u) => `  - ${u}`),
    "avoid:", ...doc.avoid.map((u) => `  - ${u}`),
    "practices:", ...doc.practices.map((p) => `  - ${"do" in p ? "do: " + p.do : "don't: " + p.dont}${p.rule ? ` [${p.rule}]` : ""}`),
    "props:", ...props, "",
    ...doc.examples.flatMap((e) => [`example ${e.name}:`, e.code]),
  ].join("\n");
  return { json: doc, text };
};
