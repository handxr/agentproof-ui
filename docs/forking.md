# Forking

## Problem

A reference repo is only useful if you can tell which parts are the example and which parts are the pattern.

## Decision

`paper` (the components and tokens) is the example. The CLI, the doc types, the generators and the tests are the pattern.

Change these:

| What | Where |
| --- | --- |
| Token values | `tokens/tokens.json` |
| Components, docs, examples, tests | `registry/components/<name>/` |
| Rules for your system | `registry/rules/` |
| Default registry | `DEFAULT_REGISTRY` in `packages/cli/src/registry.ts` |
| CLI name | `bin` in `packages/cli/package.json` |
| AGENTS.md block text | `agentBlock` in `packages/cli/src/project.ts` |
| `llms.txt` title and intro | `renderLlms` in `scripts/build-registry.ts` |
| Demo app | `apps/example/src/` |

Keep these:

- `defineDoc` and its type checks ([Component docs](component-docs.md)).
- The command contract: no prompts, `--json`, exit codes 0/1/2 ([A CLI for agents](cli-for-agents.md)).
- Rules as a table, run by `paper check` and by the registry test ([Guardrails](guardrails.md)).
- The marked, idempotent AGENTS.md block ([AGENTS.md block](agents-md.md)).
- Generated files with a `--check` mode in `pnpm check` ([Generated files](generated-files.md)).

## Steps

1. Fork and clone. `pnpm install && pnpm check`.
2. Edit `tokens/tokens.json`, replace the components, run `pnpm generate && pnpm check`.
3. Set `DEFAULT_REGISTRY` to `github:you/<repo>`.
4. Refresh the demo: `pnpm --filter example sync && pnpm --filter example build`.
5. Push. In any app: `paper init --registry github:you/<repo>`.

## Where in code

[Project structure](project-structure.md) maps every folder.
