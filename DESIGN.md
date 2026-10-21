# Design

Data shapes first. Everything else is a function over these.

## Token tree (`tokens/tokens.json`)

```ts
type Tokens = {
  color: Record<string, { light: string; dark: string }>;
  font | fontSize | fontWeight | lineHeight | space | radius | size: Record<string, string>;
};
```

Single source. `tokens/build.ts` maps it to two outputs, both generated:

- `registry/components/tokens.stylex.ts`: one `stylex.defineVars` per group (primary output). Dark mode is a
  `@media (prefers-color-scheme: dark)` value on each color var, as on juanhander.com.
- `tokens/tokens.css`: `--ds-<group>-<key>` CSS variables for non-StyleX consumers.

## DocSpec&lt;C&gt; (`<name>.docs.ts` via `defineDoc`)

```ts
type Practice = ({ do: string } | { dont: string }) & { rule?: RuleId };
type Doc<C> = {
  summary: string; use: string[]; avoid: string[]; practices: Practice[];
  examples: Record<string, () => Promise<{ default: ComponentType }>>; // real dynamic imports: bad path = tsc error
  propNotes?: Partial<Record<keyof ComponentProps<C>, string>>;        // removing a prop breaks the doc
};
```

`RuleId = keyof typeof rules`, so a practice cannot point at a rule that does not exist.

## Rules table (`registry/rules/index.ts`)

```ts
type Rule = { description: string; check(file: string, source: string): Omit<Violation, "rule" | "file">[] };
const rules = { "no-raw-color": noRawColor } satisfies Record<string, Rule>;
```

A table, not branching: `ds check` iterates it. Adding a rule is one entry.
`one-primary` is skipped: it needs JSX analysis across a "view", which has no reliable file-level definition.

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

File contents are embedded so a remote registry is one fetch (`github:user/repo` → raw `registry/registry.json`).
`llms.txt` and `llms-full.txt` are rendered from the same Registry.

## DsConfig (`ds.json` in the consumer project)

```ts
type DsConfig = { registry: string; componentsDir: string; installed: string[] };
```

## CheckViolation

```ts
type Violation = { rule: RuleId; file: string; line: number; message: string };
```

## Boundaries

`registry.json`, `ds.json` and CLI args are parsed with zod in `packages/cli/src/schema.ts`. Code past that trusts types.

## Idempotency

- `init`: writes `ds.json` only if absent (keeps `installed`), overwrites token files with registry content,
  rewrites the `<!-- ds:start -->…<!-- ds:end -->` block in place (appends if missing).
- `add`: overwrites component files with registry content, `installed` is a sorted set, block re-rendered.
Running either twice gives byte-identical files.

## Agent file

`CLAUDE.md` if it exists and `AGENTS.md` does not; otherwise `AGENTS.md`.
