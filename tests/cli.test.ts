import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, expect, test } from "vitest";

const repo = join(import.meta.dirname, "..");
const bin = join(repo, "packages/cli/dist/ds.js");

beforeAll(() => {
  const build = spawnSync("pnpm", ["--filter", "@ds/cli", "build"], { cwd: repo, encoding: "utf8" });
  expect(build.status, build.stderr).toBe(0);
});

function ds(cwd: string, ...args: string[]) {
  const r = spawnSync(process.execPath, [bin, ...args, "--registry", repo], { cwd, encoding: "utf8" });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

const project = () => mkdtempSync(join(tmpdir(), "ds-cli-"));
const read = (dir: string, f: string) => readFileSync(join(dir, f), "utf8");

test("init writes ds.json, StyleX tokens and an AGENTS.md section, and is idempotent", () => {
  const dir = project();
  writeFileSync(join(dir, "AGENTS.md"), "# My project\n\nOwn rules.\n");
  expect(ds(dir, "init").code).toBe(0);
  const first = { agents: read(dir, "AGENTS.md"), config: read(dir, "ds.json") };
  expect(JSON.parse(first.config)).toEqual({ registry: repo, componentsDir: "src/components/ds", installed: [] });
  expect(read(dir, "src/components/ds/tokens.stylex.ts")).toContain("stylex.defineVars");
  expect(first.agents.startsWith("# My project\n\nOwn rules.\n")).toBe(true);
  expect(first.agents).toContain("@stylexjs/unplugin");

  expect(ds(dir, "init").code).toBe(0);
  expect(read(dir, "AGENTS.md")).toBe(first.agents);
  expect(read(dir, "ds.json")).toBe(first.config);
  expect(first.agents.match(/<!-- ds:start -->/g)).toHaveLength(1);
});

test("init writes into CLAUDE.md when the project uses it instead of AGENTS.md", () => {
  const dir = project();
  writeFileSync(join(dir, "CLAUDE.md"), "# Claude\n");
  ds(dir, "init");
  expect(existsSync(join(dir, "AGENTS.md"))).toBe(false);
  expect(read(dir, "CLAUDE.md")).toContain("<!-- ds:start -->");
});

test("add copies the component, records it once and lists it in the agent section", () => {
  const dir = project();
  ds(dir, "init");
  const r = ds(dir, "add", "button", "--json");
  expect(r.code).toBe(0);
  expect(JSON.parse(r.out)).toEqual({ added: ["button"], files: ["src/components/ds/button/button.tsx"], dependencies: ["@stylexjs/stylex"] });
  expect(read(dir, "src/components/ds/button/button.tsx")).toBe(read(repo, "registry/components/button/button.tsx"));
  ds(dir, "add", "button");
  ds(dir, "add", "input");
  expect(JSON.parse(read(dir, "ds.json")).installed).toEqual(["button", "input"]);
  expect(read(dir, "AGENTS.md")).toContain("Installed: button, input.");
});

test("add fails clearly without init or with an unknown component", () => {
  const dir = project();
  expect(ds(dir, "add", "button")).toMatchObject({ code: 1, err: expect.stringContaining("ds init") });
  ds(dir, "init");
  expect(ds(dir, "add", "nope").code).toBe(1);
  expect(ds(dir, "add").code).toBe(2);
});

test("list, docs and tokens print machine-readable JSON", () => {
  const dir = project();
  expect(JSON.parse(ds(dir, "list", "--json").out).map((c: { name: string }) => c.name)).toEqual(["button", "input"]);
  const doc = JSON.parse(ds(dir, "docs", "input", "--json").out);
  expect(doc.props.find((p: { name: string }) => p.name === "label")).toMatchObject({ required: true, type: "string" });
  expect(doc.examples.map((e: { name: string }) => e.name)).toEqual(["basic", "with-error"]);
  expect(doc.files).toBeUndefined();
  expect(JSON.parse(ds(dir, "tokens", "--json").out).color.fg).toEqual({ light: "#111111", dark: "#ededed" });
});

test("check fails on raw colors in stylex.create and passes with tokens", () => {
  const dir = project();
  ds(dir, "init");
  ds(dir, "add", "button");
  const file = join(dir, "src/card.tsx");
  writeFileSync(file, 'import * as stylex from "@stylexjs/stylex";\nconst s = stylex.create({ card: { color: "#ff0000" } });\n');
  const bad = ds(dir, "check", "--json");
  expect(bad.code).toBe(1);
  expect(JSON.parse(bad.out).violations).toEqual([
    { rule: "no-raw-color", file: "src/card.tsx", line: 2, message: 'raw color "#ff0000"; use a color token' },
  ]);
  writeFileSync(file, 'import * as stylex from "@stylexjs/stylex";\nimport { color } from "./components/ds/tokens.stylex";\nconst s = stylex.create({ card: { color: color.danger } });\n');
  expect(ds(dir, "check")).toMatchObject({ code: 0 });
});

test("unknown command exits 2 with usage", () => {
  expect(ds(project(), "nope")).toMatchObject({ code: 2, err: expect.stringContaining("usage: ds") });
});
