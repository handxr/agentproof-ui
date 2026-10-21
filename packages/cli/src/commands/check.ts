import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { runRules } from "../../../../registry/rules/index.ts";
import type { Command } from "../command.ts";

const SKIP = new Set(["node_modules", ".git", "dist", "build", ".next", "coverage"]);
const SOURCE = /\.(tsx?|jsx?|css)$/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? (SKIP.has(d.name) ? [] : sourceFiles(join(dir, d.name))) : SOURCE.test(d.name) ? [join(dir, d.name)] : [],
  );
}

export const check: Command = async ({ cwd }) => {
  const violations = sourceFiles(cwd).flatMap((f) => runRules(relative(cwd, f), readFileSync(f, "utf8")));
  return {
    exitCode: violations.length ? 1 : 0,
    json: { ok: !violations.length, violations },
    text: violations.length
      ? violations.map((v) => `${v.file}:${v.line} ${v.rule} ${v.message}`).join("\n") + `\n${violations.length} violation(s)`
      : "ds check: no violations",
  };
};
