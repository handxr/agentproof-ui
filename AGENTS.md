# AGENTS.md

Reference architecture for design systems that agents can use. The example system is `paper`, built with React and StyleX. The CLI is also `paper`. Read `ARCHITECTURE.md` for the data shapes and `docs/` for the decisions.

## Commands

- `pnpm check`: runs the typecheck, lint, and tests, and checks that generated files are up to date. It must pass before every commit.
- `pnpm generate`: rebuilds `tokens.stylex.ts`, `tokens.css`, `registry.json`, `llms.txt`, and `llms-full.txt`.
- `pnpm build:cli`: bundles the CLI to `packages/cli/dist/paper.js`.

## Example app

`apps/example` consumes paper through the real CLI. After you change tokens or components, run `pnpm --filter example sync && pnpm --filter example build`. The CLI writes its `AGENTS.md`, `paper.json`, and `src/components/paper/`. Do not edit them by hand.

## Docs

Each file in `docs/` is the guide for one decision. Keep them in sync with the code they link to.

## Generated files (never edit by hand)

`registry/components/tokens.stylex.ts`, `tokens/tokens.css`, `registry/registry.json`, `llms.txt`, and `llms-full.txt`.
Edit the source (`tokens/tokens.json`, a component, its `.docs.ts`) and run `pnpm generate`. `pnpm check` fails if they are stale.

## Adding a component

1. Create `registry/components/<name>/` with:
   - `<name>.tsx`: one exported component. Style it with `stylex.create` and tokens from `../tokens.stylex` only. Put JSDoc on each prop. It becomes the prop description.
   - `<name>.docs.ts`: `export default defineDoc<typeof Comp>({ summary, use, avoid, practices, examples })`.
   - `<name>.test.tsx`: behavior through the DOM (roles, labels, attributes), not class names.
   - `examples/*.tsx`: each file default-exports a component and is listed in `examples` with `() => import("./examples/x")`.
2. Run `pnpm generate && pnpm check`.

`tests/registry.test.tsx` fails if any piece is missing, an example does not render, or a practice points at a rule that does not exist.

## Adding a rule

Add `registry/rules/<id>.ts` exporting a `Rule`, register it in the `rules` table in `registry/rules/index.ts`, and cover it in `tests/cli.test.ts` through the real `paper check`.

## Rules

- Use `color.*` tokens. No raw colors outside the token files.
- No new token without a real use in a component.
- The CLI never prompts. Every command works with flags only and takes `--json`. Exit codes are 0 for success, 1 for failure, and 2 for a usage error.
- The CLI parses `registry.json` and `paper.json` with zod at its boundary, in `packages/cli/src/schema.ts`. Trust the types after that.
- `init`, `add`, and `update` must stay idempotent: running them twice leaves identical files.
- The CLI never overwrites a file whose hash differs from the one recorded in `paper.json` without `--force`.
- Use conventional commits.
