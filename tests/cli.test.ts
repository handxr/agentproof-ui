import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, expect, test } from "vitest";

const repo = join(import.meta.dirname, "..");
const bin = join(repo, "packages/cli/dist/paper.js");

beforeAll(() => {
  const build = spawnSync("pnpm", ["--filter", "@paper/cli", "build"], { cwd: repo, encoding: "utf8" });
  expect(build.status, build.stderr).toBe(0);
});

function paper(cwd: string, ...args: string[]) {
  const r = spawnSync(process.execPath, [bin, ...args, "--registry", repo], { cwd, encoding: "utf8" });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

const project = () => mkdtempSync(join(tmpdir(), "paper-cli-"));
const read = (dir: string, f: string) => readFileSync(join(dir, f), "utf8");

test("init writes paper.json, StyleX tokens and an AGENTS.md section, and is idempotent", () => {
  const dir = project();
  writeFileSync(join(dir, "AGENTS.md"), "# My project\n\nOwn rules.\n");
  expect(paper(dir, "init").code).toBe(0);
  const first = { agents: read(dir, "AGENTS.md"), config: read(dir, "paper.json") };
  const config = JSON.parse(first.config);
  expect(config).toMatchObject({ registry: repo, componentsDir: "src/components/paper", installed: {} });
  expect(config.tokens.files["src/components/paper/tokens.stylex.ts"]).toMatch(/^[0-9a-f]{64}$/);
  expect(read(dir, "src/components/paper/tokens.stylex.ts")).toContain("stylex.defineVars");
  expect(first.agents.startsWith("# My project\n\nOwn rules.\n")).toBe(true);
  expect(first.agents).toContain("@stylexjs/unplugin");
  expect(first.agents).toContain("Import at least one CSS file");

  expect(paper(dir, "init").code).toBe(0);
  expect(read(dir, "AGENTS.md")).toBe(first.agents);
  expect(read(dir, "paper.json")).toBe(first.config);
  expect(first.agents.match(/<!-- paper:start -->/g)).toHaveLength(1);
});

test("init writes into CLAUDE.md when the project uses it instead of AGENTS.md", () => {
  const dir = project();
  writeFileSync(join(dir, "CLAUDE.md"), "# Claude\n");
  paper(dir, "init");
  expect(existsSync(join(dir, "AGENTS.md"))).toBe(false);
  expect(read(dir, "CLAUDE.md")).toContain("<!-- paper:start -->");
});

test("add copies the component, records it once and lists it in the agent section", () => {
  const dir = project();
  paper(dir, "init");
  const r = paper(dir, "add", "button", "--json");
  expect(r.code).toBe(0);
  expect(JSON.parse(r.out)).toEqual({ added: ["button"], files: ["src/components/paper/button/button.tsx"], dependencies: ["@stylexjs/stylex"] });
  expect(read(dir, "src/components/paper/button/button.tsx")).toBe(read(repo, "registry/components/button/button.tsx"));
  paper(dir, "add", "button");
  paper(dir, "add", "input");
  const installed = JSON.parse(read(dir, "paper.json")).installed;
  expect(Object.keys(installed)).toEqual(["button", "input"]);
  expect(Object.keys(installed.button.files)).toEqual(["src/components/paper/button/button.tsx"]);
  expect(read(dir, "AGENTS.md")).toContain("Installed: button, input.");
});

test("add fails clearly without init or with an unknown component", () => {
  const dir = project();
  expect(paper(dir, "add", "button")).toMatchObject({ code: 1, err: expect.stringContaining("paper init") });
  paper(dir, "init");
  expect(paper(dir, "add", "nope").code).toBe(1);
  expect(paper(dir, "add").code).toBe(2);
});

test("list, docs and tokens print machine-readable JSON", () => {
  const dir = project();
  expect(JSON.parse(paper(dir, "list", "--json").out).map((c: { name: string }) => c.name)).toEqual(["button", "input"]);
  const doc = JSON.parse(paper(dir, "docs", "input", "--json").out);
  expect(doc.props.find((p: { name: string }) => p.name === "label")).toMatchObject({ required: true, type: "string" });
  expect(doc.examples.map((e: { name: string }) => e.name)).toEqual(["basic", "with-error"]);
  expect(doc.files).toBeUndefined();
  expect(JSON.parse(paper(dir, "tokens", "--json").out).color.fg).toEqual({ light: "#111111", dark: "#ededed" });
});

test("check fails on raw colors in stylex.create and passes with tokens", () => {
  const dir = project();
  paper(dir, "init");
  paper(dir, "add", "button");
  const file = join(dir, "src/card.tsx");
  writeFileSync(file, 'import * as stylex from "@stylexjs/stylex";\nconst s = stylex.create({ card: { color: "#ff0000" } });\n');
  const bad = paper(dir, "check", "--json");
  expect(bad.code).toBe(1);
  expect(JSON.parse(bad.out).violations).toEqual([
    { rule: "no-raw-color", file: "src/card.tsx", line: 2, message: 'raw color "#ff0000"; use a color token' },
  ]);
  writeFileSync(file, 'import * as stylex from "@stylexjs/stylex";\nimport { color } from "./components/paper/tokens.stylex";\nconst s = stylex.create({ card: { color: color.danger } });\n');
  expect(paper(dir, "check")).toMatchObject({ code: 0 });
});

test("unknown command exits 2 with usage", () => {
  expect(paper(project(), "nope")).toMatchObject({ code: 2, err: expect.stringContaining("usage: paper") });
});

const BUTTON = "src/components/paper/button/button.tsx";

function installed(...names: string[]) {
  const dir = project();
  paper(dir, "init");
  if (names.length) paper(dir, "add", ...names);
  return dir;
}

test("add refuses to overwrite a locally modified file unless --force", () => {
  const dir = installed("button");
  writeFileSync(join(dir, BUTTON), "// mine\n");
  const r = paper(dir, "add", "button");
  expect(r).toMatchObject({ code: 1, err: expect.stringContaining(BUTTON) });
  expect(read(dir, BUTTON)).toBe("// mine\n");
  expect(paper(dir, "add", "button", "--force").code).toBe(0);
  expect(read(dir, BUTTON)).toBe(read(repo, "registry/components/button/button.tsx"));
});

test("add refuses an unrecorded file that differs from the registry, and accepts an identical one", () => {
  const dir = installed();
  mkdirSync(join(dir, "src/components/paper/button"), { recursive: true });
  writeFileSync(join(dir, BUTTON), read(repo, "registry/components/button/button.tsx"));
  expect(paper(dir, "add", "button").code).toBe(0);
  const other = installed();
  mkdirSync(join(other, "src/components/paper/button"), { recursive: true });
  writeFileSync(join(other, BUTTON), "// someone else's button\n");
  expect(paper(other, "add", "button").code).toBe(1);
});

test("update rewrites files paper wrote, skips local changes and exits 1 unless --force", () => {
  const dir = installed("button", "input");
  const input = "src/components/paper/input/input.tsx";
  // Simulate an older registry version: the file on disk matches its record but not the registry.
  const config = JSON.parse(read(dir, "paper.json"));
  writeFileSync(join(dir, input), "// old input\n");
  config.installed.input.files[input] = createHash("sha256").update("// old input\n").digest("hex");
  writeFileSync(join(dir, "paper.json"), JSON.stringify(config));
  writeFileSync(join(dir, BUTTON), "// mine\n");

  const r = paper(dir, "update", "--json");
  expect(r.code).toBe(1);
  const out = JSON.parse(r.out);
  expect(out.updated).toEqual([input]);
  expect(out.skipped).toEqual([BUTTON]);
  expect(out.unchanged).toContain("src/components/paper/tokens.stylex.ts");
  expect(read(dir, input)).toBe(read(repo, "registry/components/input/input.tsx"));
  expect(read(dir, BUTTON)).toBe("// mine\n");

  expect(paper(dir, "update", "button", "--force").code).toBe(0);
  expect(read(dir, BUTTON)).toBe(read(repo, "registry/components/button/button.tsx"));
  expect(JSON.parse(paper(dir, "update", "--json").out)).toMatchObject({ updated: [], skipped: [] });
});

test("update skips a component missing from the registry, updates the rest and exits 1 even with --force", () => {
  const dir = installed("button");
  const config = JSON.parse(read(dir, "paper.json"));
  config.installed.card = { files: {} };
  writeFileSync(join(dir, BUTTON), "// old button\n");
  config.installed.button.files[BUTTON] = createHash("sha256").update("// old button\n").digest("hex");
  writeFileSync(join(dir, "paper.json"), JSON.stringify(config));

  const r = paper(dir, "update", "--json");
  expect(r.code).toBe(1);
  expect(JSON.parse(r.out)).toMatchObject({ updated: [BUTTON], skipped: [], missing: ["card"] });
  expect(read(dir, BUTTON)).toBe(read(repo, "registry/components/button/button.tsx"));
  expect(JSON.parse(read(dir, "paper.json")).installed.card).toBeDefined();

  const forced = paper(dir, "update", "--force");
  expect(forced.code).toBe(1);
  expect(forced.out).toContain("skipped (missing from the registry): card");
});

test("update reads an old paper.json with installed as a list and writes the record form", () => {
  const dir = installed("button");
  writeFileSync(join(dir, "paper.json"), JSON.stringify({ registry: repo, componentsDir: "src/components/paper", installed: ["button"] }));
  expect(paper(dir, "update").code).toBe(0);
  const config = JSON.parse(read(dir, "paper.json"));
  expect(Object.keys(config.installed.button.files)).toEqual([BUTTON]);
  expect(Object.keys(config.tokens.files).length).toBeGreaterThan(0);
});

test("check flags a stale AGENTS.md block and passes after update", () => {
  const dir = installed("button");
  writeFileSync(join(dir, "AGENTS.md"), read(dir, "AGENTS.md").replace("Installed: button.", "Installed: none yet."));
  const r = paper(dir, "check", "--json");
  expect(r.code).toBe(1);
  expect(JSON.parse(r.out)).toMatchObject({ ok: false, violations: [], agentBlock: "stale" });
  expect(paper(dir, "check").err + paper(dir, "check").out).toContain("paper update");
  paper(dir, "update");
  expect(JSON.parse(paper(dir, "check", "--json").out)).toMatchObject({ ok: true, agentBlock: "ok" });
});
