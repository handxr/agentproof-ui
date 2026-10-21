# Forking

## Problem

A reference repo is only useful if you can tell which parts are the example and which parts are the pattern. Someone who forks it, or their agent, also needs an order to work in and a way to know each step is finished.

## Decision

`paper` (the components and tokens) is the example. The CLI, the doc types, the generators and the tests are the pattern. A fork replaces the example with its own design system, keeps the pattern, and publishes the CLI under its own name. This repo never publishes to npm.

Keep these:

- `defineDoc` and its type checks ([Component docs](component-docs.md)).
- The command contract: no prompts, `--json`, and exit codes 0, 1, and 2 ([A CLI for agents](cli-for-agents.md)).
- Rules as a table, run by `paper check` and by the registry test ([Guardrails](guardrails.md)).
- The marked, idempotent AGENTS.md block ([AGENTS.md block](agents-md.md)).
- Generated files with a `--check` mode in `pnpm check` ([Generated files](generated-files.md)).

## Steps

A person or an agent can follow these steps in order. Each step says what to decide, which files to change, and how to tell it is done. The linked guides explain why each piece works the way it does.

Before you start, fork and clone the repo, then run `pnpm install && pnpm check`. It must pass before you change anything.

### 1. Inventory the source design system

Decide what your design system actually has. Read its source, whether that is a Figma export, CSS files, or a component package, and write down three lists:

- Tokens: colors (with light and dark values), font, sizes, spacing, radius.
- Components: the ones that exist today, with their props and variants.
- Rules: every written guideline, such as "only use color tokens" or "one primary button per view".

Change nothing yet. Done when you have the three lists. Leave out anything the source does not have. Do not invent components or tokens to fill gaps.

### 2. Tokens

Decide how your tokens map to the groups in [`tokens/tokens.json`](../tokens/tokens.json): `color`, `font`, `fontSize`, `fontWeight`, `lineHeight`, `space`, `radius` and `size`. Drop a group you do not use, and give each color a `light` and a `dark` value.

Change `tokens/tokens.json`, then run `pnpm generate`. It rewrites `registry/components/tokens.stylex.ts` and `tokens/tokens.css`. Do not edit those two files by hand.

Done when `pnpm generate` succeeds and `pnpm typecheck` passes. The existing components may fail type checks if they use a token you removed. Step 3 fixes that. Why: [Tokens](tokens.md).

### 3. Components

Decide which of your components go into the registry first. Start with two or three that you use often. Only port components from your inventory.

Replace `registry/components/button/` and `registry/components/input/` with one folder per component, `registry/components/<name>/`, containing:

- `<name>.tsx`: one exported component, styled with `stylex.create` and tokens from `../tokens.stylex` only, with JSDoc on each prop.
- `<name>.docs.ts`: `defineDoc` with `summary`, `use`, `avoid`, `practices` and `examples`.
- `examples/*.tsx`: each file default-exports one usage example.
- `<name>.test.tsx`: behavior through the DOM (roles, labels, attributes), not class names.

The "Adding a component" section in [`AGENTS.md`](../AGENTS.md) lists the exact shape of each file. Run `pnpm generate`.

Done when `pnpm typecheck && pnpm test` passes. The type check fails if a doc names a prop that does not exist. `tests/registry.test.tsx` fails if a file is missing or an example does not render. Why: [Components](components.md) and [Component docs](component-docs.md).

### 4. Rules

Decide, for each rule in your inventory, whether code can check it. "No raw colors" or "only these font sizes" can be checked by reading a file. "Use one primary button per view" needs judgment.

For each rule that code can check, add `registry/rules/<id>.ts` exporting a `Rule`, add it to the `rules` table in `registry/rules/index.ts`, and cover it in `tests/cli.test.ts` through the real `paper check`. Write one file and one table entry per rule. Remove `no-raw-color` only if your system allows raw colors.

Put each rule that needs judgment in the `practices` of the component it applies to, in its `<name>.docs.ts`. If a practice has a matching check, link it with `rule: "<id>"`.

Done when `pnpm test` passes. The registry test fails if a practice points at a rule that does not exist. Why: [Guardrails](guardrails.md).

### 5. Rename the CLI

Decide the package name and command name for your CLI, for example `@acme/ui-cli` with the command `acme-ui`. Check that the npm name is free if you plan to publish.

Change:

| What | Where |
| --- | --- |
| Package name and command | `name` and `bin` in `packages/cli/package.json` |
| Default registry | `DEFAULT_REGISTRY` in `packages/cli/src/registry.ts`, set to `github:<you>/<repo>` |
| Usage text | `USAGE` in `packages/cli/src/index.ts` |
| AGENTS.md block text | `agentBlock` in `packages/cli/src/project.ts`, including the `npx paper` commands and the StyleX line |
| `llms.txt` title and intro | `renderLlms` in `scripts/build-registry.ts` |

The `npx paper` commands in `llms.txt` and the AGENTS.md block assume the fork publishes its CLI under its own name. In this repo, run the CLI with `pnpm paper` from `apps/example`.

If you rename the package, also update the `--filter @paper/cli` references in the root `package.json` (`build:cli`), `apps/example/package.json` (`sync`) and `tests/cli.test.ts`. Run `pnpm generate`.

Done when `pnpm build:cli` succeeds and `pnpm test` passes. Why: [A CLI for agents](cli-for-agents.md), [AGENTS.md block](agents-md.md) and [Distribution](distribution.md).

### 6. Refresh the example app

Decide what the demo in `apps/example/src/` shows. Use your own components from step 3.

Change `apps/example/src/app.tsx`, and in `apps/example/package.json` list your components in the `sync` script instead of `button input`. Then run:

```sh
pnpm --filter example sync
pnpm --filter example build
```

`sync` builds the CLI and writes `apps/example/AGENTS.md`, `paper.json` and `src/components/paper/` through the real CLI. Do not edit them by hand.

Done when the build succeeds and `pnpm --filter example check:paper` exits with code 0.

### 7. Finish

Run:

```sh
pnpm check
pnpm --filter example build
```

The fork is done when both pass. Push to your fork, then run `<your-cli> init --registry github:<you>/<repo>` in any app to install from it. To publish the CLI, see [Distribution](distribution.md).

## Where in code

[Project structure](project-structure.md) maps every folder.
