import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { extractProps } from "@ds/core/extract-props";
import type { Doc } from "@ds/core/define-doc";
import type { Registry, RegistryEntry } from "../packages/cli/src/schema.ts";
import { rules } from "../registry/rules/index.ts";

const root = import.meta.dirname + "/../";
const componentsDir = root + "registry/components/";
const read = (p: string) => readFileSync(p, "utf8");

export function componentNames(): string[] {
  return readdirSync(componentsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
}

async function buildEntry(name: string): Promise<RegistryEntry> {
  const dir = `${componentsDir}${name}/`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: Doc<any> = (await import(`${dir}${name}.docs.ts`)).default;
  const source = read(`${dir}${name}.tsx`);
  const notes: Record<string, string | undefined> = doc.propNotes ?? {};
  return {
    name,
    summary: doc.summary,
    use: doc.use,
    avoid: doc.avoid,
    practices: doc.practices,
    props: extractProps(`${dir}${name}.tsx`, root + "tsconfig.json").map((p) => (notes[p.name] ? { ...p, note: notes[p.name] } : p)),
    examples: Object.entries(doc.examples).map(([key, load]) => {
      const path = /import\(["'](.+?)["']\)/.exec(load.toString())?.[1];
      if (!path) throw new Error(`${name}: example "${key}" is not a dynamic import`);
      return { name: key, code: read(`${dir}${path}.tsx`) };
    }),
    dependencies: [...source.matchAll(/from "([^.][^"]*)"/g)].map((m) => m[1]).filter((d) => d !== "react").sort(),
    files: [{ path: `${name}/${name}.tsx`, content: source }],
  };
}

export async function buildRegistry(): Promise<Registry> {
  return {
    version: JSON.parse(read(root + "packages/cli/package.json")).version,
    tokens: [
      { path: "tokens.stylex.ts", content: read(componentsDir + "tokens.stylex.ts") },
      { path: "tokens.css", content: read(root + "tokens/tokens.css") },
    ],
    components: await Promise.all(componentNames().map(buildEntry)),
  };
}

const practiceText = (p: RegistryEntry["practices"][number]) =>
  ("do" in p ? `Do: ${p.do}` : `Don't: ${p.dont}`) + (p.rule ? ` (ds check: ${p.rule})` : "");

export function renderComponent(c: RegistryEntry): string {
  const props = c.props.map((p) => `- \`${p.name}${p.required ? "" : "?"}: ${p.type}\`${p.default ? ` = ${p.default}` : ""}. ${p.description}${p.note ? ` ${p.note}` : ""}`);
  return [
    `## ${c.name}`, "", c.summary, "",
    "Use for:", ...c.use.map((u) => `- ${u}`), "",
    "Avoid for:", ...c.avoid.map((u) => `- ${u}`), "",
    "Practices:", ...c.practices.map((p) => `- ${practiceText(p)}`), "",
    "Props:", ...props, "",
    ...c.examples.flatMap((e) => [`Example \`${e.name}\`:`, "", "```tsx", e.code.trimEnd(), "```", ""]),
  ].join("\n");
}

const HEAD = (r: Registry) => [
  "# design-system",
  "",
  `> Agent-first, minimalist React design system styled with StyleX. v${r.version}. Components are copied into your project with the CLI: \`npx ds add <name>\`.`,
  "",
];

export function renderLlms(r: Registry): string {
  return [
    ...HEAD(r),
    "## Components", "",
    ...r.components.map((c) => `- ${c.name}: ${c.summary} Docs: \`npx ds docs ${c.name}\`.`), "",
    "## Tokens", "",
    "- [tokens.json](tokens/tokens.json): color, font, fontSize, fontWeight, lineHeight, space, radius, size. StyleX: `import { color, space } from \"./tokens.stylex\"`.", "",
    "## Rules (`npx ds check`)", "",
    ...Object.entries(rules).map(([id, r]) => `- ${id}: ${r.description}`), "",
    "## Full docs", "", "- [llms-full.txt](llms-full.txt)", "",
  ].join("\n");
}

export function renderLlmsFull(r: Registry): string {
  return [...HEAD(r), ...r.components.map(renderComponent)].join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const r = await buildRegistry();
  const outputs = {
    "registry/registry.json": JSON.stringify(r, null, 2) + "\n",
    "llms.txt": renderLlms(r),
    "llms-full.txt": renderLlmsFull(r),
  };
  const check = process.argv.includes("--check");
  let stale = false;
  for (const [file, content] of Object.entries(outputs)) {
    if (!check) writeFileSync(root + file, content);
    else if ((() => { try { return read(root + file); } catch { return ""; } })() !== content) {
      console.error(`stale: ${file} (run pnpm generate)`);
      stale = true;
    }
  }
  if (stale) process.exit(1);
}
