import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { configSchema, type PaperConfig, type Registry, type RegistryFile, type Written } from "./schema.ts";

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
  const sorted = <T>(r: Record<string, T>) => Object.fromEntries(Object.entries(r).sort(([a], [b]) => a.localeCompare(b)));
  const installed = sorted(Object.fromEntries(Object.entries(config.installed).map(([name, w]) => [name, { files: sorted(w.files) }])));
  writeFileSync(join(cwd, CONFIG), JSON.stringify({ ...config, installed, tokens: { files: sorted(config.tokens.files) } }, null, 2) + "\n");
}

export const hash = (content: string) => createHash("sha256").update(content).digest("hex");

/**
 * new: missing on disk. unchanged: already equals the registry content.
 * clean: equals what paper last wrote, so it is safe to replace.
 * modified: changed locally, or present with no record and different from the registry.
 */
export type FileStatus = "new" | "unchanged" | "clean" | "modified";
export type PlannedFile = { path: string; content: string; status: FileStatus };

export function planFiles(cwd: string, config: PaperConfig, record: Written, files: RegistryFile[]): PlannedFile[] {
  return files.map((f) => {
    const path = join(config.componentsDir, f.path);
    const abs = join(cwd, path);
    if (!existsSync(abs)) return { path, content: f.content, status: "new" };
    const current = hash(readFileSync(abs, "utf8"));
    const status = current === hash(f.content) ? "unchanged" : record.files[path] === current ? "clean" : "modified";
    return { path, content: f.content, status };
  });
}

/** Writes every planned file except skipped ones and returns the new record. Skipped files keep their old hash. */
export function applyPlan(cwd: string, record: Written, plan: PlannedFile[], skip: (f: PlannedFile) => boolean): Written {
  const files = { ...record.files };
  for (const f of plan) {
    if (skip(f)) continue;
    if (f.status !== "unchanged") {
      mkdirSync(dirname(join(cwd, f.path)), { recursive: true });
      writeFileSync(join(cwd, f.path), f.content);
    }
    files[f.path] = hash(f.content);
  }
  return { files };
}

export function assertNoConflicts(plan: PlannedFile[], force: boolean | undefined): void {
  const modified = plan.filter((f) => f.status === "modified").map((f) => f.path);
  if (modified.length && !force)
    throw new Error(`locally modified, not overwritten: ${modified.join(", ")}\nrun \`paper update\` to see what is safe to update, or pass --force to overwrite`);
}

export function agentFile(cwd: string): string {
  return !existsSync(join(cwd, "AGENTS.md")) && existsSync(join(cwd, "CLAUDE.md")) ? "CLAUDE.md" : "AGENTS.md";
}

export function agentBlock(config: PaperConfig, registry: Registry): string {
  const names = Object.keys(config.installed).sort();
  const installed = names.length ? names.join(", ") : "none yet";
  return [
    START,
    "## Design system (paper)",
    "",
    `Components are copied into \`${config.componentsDir}\` from \`${config.registry}\` (v${registry.version}). Config: \`paper.json\`.`,
    "",
    "- Before building UI, check what exists: `npx paper list`.",
    "- Before using a component, read its rules and props: `npx paper docs <name>`.",
    "- Add components with `npx paper add <name>`. Do not copy or rewrite them by hand.",
    "- Update them with `npx paper update`. It skips files you changed locally and lists them.",
    `- Style with StyleX (\`stylex.create\`) and the tokens in \`${config.componentsDir}/tokens.stylex.ts\` (\`npx paper tokens\`). No raw hex or rgb colors.`,
    "- StyleX needs its bundler plugin: `@stylexjs/unplugin` for Vite or Next, or `@stylexjs/babel-plugin`. Without it, `stylex.create` throws at runtime.",
    "- Import at least one CSS file from your entry, for example `import \"./index.css\"` in `main.tsx`. The StyleX plugin adds its CSS to the bundle's stylesheet. With no CSS import, there is no stylesheet, and components render unstyled.",
    "- Run `npx paper check` before you commit. It exits non-zero on violations.",
    `- Installed: ${installed}.`,
    END,
  ].join("\n");
}

/** The current paper block in the agent file, or undefined if there is none. */
export function readAgentBlock(cwd: string): string | undefined {
  const path = join(cwd, agentFile(cwd));
  const current = existsSync(path) ? readFileSync(path, "utf8") : "";
  const start = current.indexOf(START);
  const end = current.indexOf(END);
  return start !== -1 && end > start ? current.slice(start, end + END.length) : undefined;
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
