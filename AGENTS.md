# AGENTS.md

Agent-first React design system styled with StyleX. Read `DESIGN.md` for the data shapes.

## Commands

- `pnpm check`: typecheck + lint + test + generated files up to date. Must pass before every commit.
- `pnpm generate`: rebuild `tokens.stylex.ts`, `tokens.css`, `registry.json`, `llms.txt`, `llms-full.txt`.
- `pnpm build:cli`: bundle the CLI to `packages/cli/dist/paper.js`.

## Generated files (never edit by hand)

`registry/components/tokens.stylex.ts`, `tokens/tokens.css`, `registry/registry.json`, `llms.txt`, `llms-full.txt`.
Edit the source (`tokens/tokens.json`, a component, its `.docs.ts`) and run `pnpm generate`. `pnpm check` fails if they are stale.

## Adding a component

1. Create `registry/components/<name>/` with:
   - `<name>.tsx`: one exported component. Styles with `stylex.create` and tokens from `../tokens.stylex` only. JSDoc on each prop (it becomes the docs).
   - `<name>.docs.ts`: `export default defineDoc<typeof Comp>({ summary, use, avoid, practices, examples })`.
   - `<name>.test.tsx`: behavior through the DOM (roles, labels, attributes), not class names.
   - `examples/*.tsx`: each a default-exported component, listed in `examples` via `() => import("./examples/x")`.
2. `pnpm generate && pnpm check`.

`tests/registry.test.tsx` fails if any piece is missing, an example does not render, or a practice points at a rule that does not exist.

## Adding a rule

Add `registry/rules/<id>.ts` exporting a `Rule`, register it in the `rules` table in `registry/rules/index.ts`, and cover it in `tests/cli.test.ts` through the real `paper check`.

## Rules

- No raw colors anywhere outside the token files: use `color.*`.
- No new token without a real use in a component.
- CLI is non-interactive: every command works with flags only, `--json` for machines, exit 0 ok / 1 failure / 2 usage.
- `registry.json` and `paper.json` are parsed with zod at the CLI boundary (`packages/cli/src/schema.ts`); trust the types after that.
- `init` and `add` must stay idempotent: running them twice leaves identical files.
- Conventional commits.
