import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { configSchema, type DsConfig, type Registry, type RegistryFile } from "./schema.ts";

const CONFIG = "ds.json";
const START = "<!-- ds:start -->";
const END = "<!-- ds:end -->";

export function readConfig(cwd: string): DsConfig | undefined {
  const path = join(cwd, CONFIG);
  if (!existsSync(path)) return undefined;
  const parsed = configSchema.safeParse(JSON.parse(readFileSync(path, "utf8")));
  if (!parsed.success) throw new Error(`invalid ${CONFIG}: ${parsed.error.message}`);
  return parsed.data;
}

export function writeConfig(cwd: string, config: DsConfig): void {
  writeFileSync(join(cwd, CONFIG), JSON.stringify({ ...config, installed: [...new Set(config.installed)].sort() }, null, 2) + "\n");
}

export function writeFiles(cwd: string, config: DsConfig, files: RegistryFile[]): string[] {
  return files.map((f) => {
    const path = join(config.componentsDir, f.path);
    mkdirSync(dirname(join(cwd, path)), { recursive: true });
    writeFileSync(join(cwd, path), f.content);
    return path;
  });
}

export function agentFile(cwd: string): string {
  return !existsSync(join(cwd, "AGENTS.md")) && existsSync(join(cwd, "CLAUDE.md")) ? "CLAUDE.md" : "AGENTS.md";
}

function agentBlock(config: DsConfig, registry: Registry): string {
  const installed = config.installed.length ? config.installed.join(", ") : "none yet";
  return [
    START,
    "## Design system",
    "",
    `Components are copied into \`${config.componentsDir}\` from \`${config.registry}\` (v${registry.version}). Config: \`ds.json\`.`,
    "",
    "- Before building UI, check what exists: `npx ds list`.",
    "- Before using a component, read its rules and props: `npx ds docs <name>`.",
    "- Add components with `npx ds add <name>`. Do not copy or rewrite them by hand.",
    `- Style with StyleX (\`stylex.create\`) and the tokens in \`${config.componentsDir}/tokens.stylex.ts\` (\`npx ds tokens\`). No raw hex/rgb colors.`,
    "- StyleX needs its bundler plugin (e.g. `@stylexjs/unplugin` for Vite/Next, or `@stylexjs/babel-plugin`); without it `stylex.create` throws at runtime.",
    "- Run `npx ds check` before committing; it exits non-zero on violations.",
    `- Installed: ${installed}.`,
    END,
  ].join("\n");
}

export function writeAgentBlock(cwd: string, config: DsConfig, registry: Registry): string {
  const file = agentFile(cwd);
  const path = join(cwd, file);
  const current = existsSync(path) ? readFileSync(path, "utf8") : "";
  const block = agentBlock(config, registry);
  const start = current.indexOf(START);
  const end = current.indexOf(END);
  const next =
    start !== -1 && end > start
      ? current.slice(0, start) + block + current.slice(end + END.length)
      : (current ? current.replace(/\n*$/, "\n\n") : "") + block + "\n";
  writeFileSync(path, next);
  return file;
}
