# Architecture

The data shapes the code is built on. Read them before changing the CLI or the generators.

## Token tree (`tokens/tokens.json`)

```ts
type Tokens = {
  color: Record<string, { light: string; dark: string }>;
  font | fontSize | fontWeight | lineHeight | space | radius | size: Record<string, string>;
};
```

This file is the only source of token values. `tokens/build.ts` generates two outputs from it:

- `registry/components/tokens.stylex.ts`: one `stylex.defineVars` per group. Components import from this file. Dark mode is a
  `@media (prefers-color-scheme: dark)` value on each color variable, as on juanhander.com.
- `tokens/tokens.css`: `--paper-<group>-<key>` CSS variables for non-StyleX consumers.

## Doc (`<name>.docs.ts`, through `defineDoc`)

```ts
type Practice = ({ do: string } | { dont: string }) & { rule?: RuleId };
type Doc<C> = {
  summary: string; use: string[]; avoid: string[]; practices: Practice[];
  examples: Record<string, () => Promise<{ default: ComponentType }>>; // dynamic imports, so a wrong path fails tsc
  propNotes?: Partial<Record<keyof ComponentProps<C>, string>>;        // removing a prop fails tsc
};
```

`RuleId = keyof typeof rules`, so a practice cannot point at a rule that does not exist.

## Rules table (`registry/rules/index.ts`)

```ts
type Rule = { description: string; check(file: string, source: string): Omit<Violation, "rule" | "file">[] };
const rules = { "no-raw-color": noRawColor } satisfies Record<string, Rule>;
```

`paper check` runs every rule in the table. To add a rule, add one entry.
There is no `one-primary` rule. It would need JSX analysis across a "view", and a view has no reliable file-level definition.

## Registry (`registry/registry.json`, generated)

```ts
type RegistryFile = { path: string; content: string };   // path relative to the components dir
type RegistryEntry = {
  name: string; summary: string; use: string[]; avoid: string[]; practices: Practice[];
  props: PropInfo[];                                    // from TS types via react-docgen-typescript
  examples: { name: string; code: string }[];
  dependencies: string[];                               // npm packages the copied files need
  files: RegistryFile[];
};
type Registry = { version: string; tokens: RegistryFile[]; components: RegistryEntry[] };
```

The registry embeds file contents, so the CLI reads a remote registry in one fetch. For `github:user/repo`, it fetches the raw `registry/registry.json`.
`scripts/build-registry.ts` renders `llms.txt` and `llms-full.txt` from the same `Registry`.

## PaperConfig (`paper.json` in the consumer project)

```ts
type PaperConfig = { registry: string; componentsDir: string; installed: string[] };
```

## Violation

```ts
type Violation = { rule: RuleId; file: string; line: number; message: string };
```

## Boundaries

The CLI parses `registry.json` and `paper.json` with zod in `packages/cli/src/schema.ts`. Code past that point trusts the types.

## Idempotency

- `init` writes `paper.json` only if it is missing, so `installed` survives. It overwrites the token files with the registry content.
  It rewrites the block between `<!-- paper:start -->` and `<!-- paper:end -->` in place, or appends the block if it is missing.
- `add` overwrites the component files with the registry content, keeps `installed` sorted and without duplicates, and rewrites the block.
Running either twice gives byte-identical files.

## Agent file

The CLI writes to `CLAUDE.md` if it exists and `AGENTS.md` does not. Otherwise it writes to `AGENTS.md`.
