import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { configSchema, type PaperConfig, type Registry, type RegistryFile } from "./schema.ts";

const CONFIG = "paper.json";
const START = "<!-- paper:start -->";
const END = "<!-- paper:end -->";

export function readConfig(cwd: string): PaperConfig | undefined {
  const path = join(cwd, CONFIG);
  if (!existsSync(path)) return undefined;
  const parsed = configSchema.safeParse(JSON.parse(readFileSync(path, "utf8")));
  if (!parsed.success) throw new Error(`invalid ${CONFIG}: ${parsed.error.message}`);
  return parsed.data;
}

export function writeConfig(cwd: string, config: PaperConfig): void {
  writeFileSync(join(cwd, CONFIG), JSON.stringify({ ...config, installed: [...new Set(config.installed)].sort() }, null, 2) + "\n");
}

export function writeFiles(cwd: string, config: PaperConfig, files: RegistryFile[]): string[] {
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

function agentBlock(config: PaperConfig, registry: Registry): string {
  const installed = config.installed.length ? config.installed.join(", ") : "none yet";
  return [
    START,
    "## Design system (paper)",
    "",
    `Components are copied into \`${config.componentsDir}\` from \`${config.registry}\` (v${registry.version}). Config: \`paper.json\`.`,
    "",
    "- Before building UI, check what exists: `npx paper list`.",
    "- Before using a component, read its rules and props: `npx paper docs <name>`.",
    "- Add components with `npx paper add <name>`. Do not copy or rewrite them by hand.",
    `- Style with StyleX (\`stylex.create\`) and the tokens in \`${config.componentsDir}/tokens.stylex.ts\` (\`npx paper tokens\`). No raw hex or rgb colors.`,
    "- StyleX needs its bundler plugin: `@stylexjs/unplugin` for Vite or Next, or `@stylexjs/babel-plugin`. Without it, `stylex.create` throws at runtime.",
    "- Import at least one CSS file from your entry, for example `import \"./index.css\"` in `main.tsx`. The StyleX plugin adds its CSS to the bundle's stylesheet. With no CSS import, there is no stylesheet, and components render unstyled.",
    "- Run `npx paper check` before you commit. It exits non-zero on violations.",
    `- Installed: ${installed}.`,
    END,
  ].join("\n");
}

export function writeAgentBlock(cwd: string, config: PaperConfig, registry: Registry): string {
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
