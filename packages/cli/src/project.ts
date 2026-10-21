import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
 * new: missing on disk and never written by paper. unchanged: already equals the registry content.
 * clean: equals what paper last wrote, so it is safe to replace.
 * modified: changed locally, or present with no record and different from the registry.
 * deleted: paper wrote it and it is gone from disk, so the user removed it.
 */
export type FileStatus = "new" | "unchanged" | "clean" | "modified" | "deleted";
export type PlannedFile = { path: string; content: string; status: FileStatus };

export function planFiles(cwd: string, config: PaperConfig, record: Written, files: RegistryFile[]): PlannedFile[] {
  return files.map((f) => {
    const path = join(config.componentsDir, f.path);
    const abs = join(cwd, path);
    if (!existsSync(abs)) return { path, content: f.content, status: record.files[path] ? "deleted" : "new" };
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

/** Files with local changes: edited or deleted. paper leaves them alone unless --force. */
export const isLocalChange = (f: PlannedFile) => f.status === "modified" || f.status === "deleted";

export function assertNoConflicts(plan: PlannedFile[], force: boolean | undefined): void {
  const changed = plan.filter(isLocalChange).map((f) => `${f.path} (${f.status})`);
  if (changed.length && !force)
    throw new Error(`locally changed, not overwritten: ${changed.join(", ")}\nrun \`paper update\` to see what is safe to update, or pass --force to overwrite`);
}

/**
 * Recorded files the registry no longer ships. A clean or already missing one is deleted and its record dropped.
 * A modified one is kept, with its record, unless force.
 */
export function pruneOrphans(cwd: string, record: Written, plan: PlannedFile[], force: boolean | undefined): { record: Written; removed: string[]; kept: string[] } {
  const shipped = new Set(plan.map((f) => f.path));
  const files = { ...record.files };
  const removed: string[] = [];
  const kept: string[] = [];
  for (const [path, recorded] of Object.entries(record.files)) {
    if (shipped.has(path)) continue;
    const abs = join(cwd, path);
    const present = existsSync(abs);
    if (present && hash(readFileSync(abs, "utf8")) !== recorded && !force) {
      kept.push(path);
      continue;
    }
    if (present) rmSync(abs);
    delete files[path];
    removed.push(path);
  }
  return { record: { files }, removed, kept };
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

type BlockRange = { start: number; end: number } | "none" | "malformed";

/** Where the paper block sits. Malformed: only one marker, or the end marker comes first. */
function blockRange(content: string): BlockRange {
  const start = content.indexOf(START);
  const end = content.indexOf(END);
  if (start === -1 && end === -1) return "none";
  if (start === -1 || end < start) return "malformed";
  return { start, end: end + END.length };
}

const readAgentFile = (cwd: string) => {
  const path = join(cwd, agentFile(cwd));
  return existsSync(path) ? readFileSync(path, "utf8") : "";
};

/** The current paper block in the agent file, undefined if there is none, "malformed" if its markers are broken. */
export function readAgentBlock(cwd: string): string | undefined | "malformed" {
  const current = readAgentFile(cwd);
  const range = blockRange(current);
  if (range === "malformed") return "malformed";
  return range === "none" ? undefined : current.slice(range.start, range.end);
}

/** Throws before anything is written if the agent file has broken markers, so paper never guesses which text is its own. */
export function assertAgentBlockWellFormed(cwd: string): void {
  if (blockRange(readAgentFile(cwd)) === "malformed")
    throw new Error(`${agentFile(cwd)}: the paper block markers are broken. Make sure it has one ${START} followed by one ${END}, or remove both, then rerun`);
}

export function writeAgentBlock(cwd: string, config: PaperConfig, registry: Registry): string {
  assertAgentBlockWellFormed(cwd);
  const file = agentFile(cwd);
  const current = readAgentFile(cwd);
  const block = agentBlock(config, registry);
  const range = blockRange(current) as Exclude<BlockRange, "malformed">;
  const next =
    range !== "none"
      ? current.slice(0, range.start) + block + current.slice(range.end)
      : (current ? current.replace(/\n*$/, "\n\n") : "") + block + "\n";
  writeFileSync(join(cwd, file), next);
  return file;
}
