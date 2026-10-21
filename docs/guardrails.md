# Guardrails

## Problem

A rule written in prose is a suggestion. "Use color tokens" in a doc does not stop an agent from writing `color: "#333"`, and nothing flags it before review.

## Decision

Any rule that code can check is a check. `paper check` scans the project's `.ts`, `.tsx`, `.js`, `.jsx`, and `.css` files. It skips `node_modules`, `.git`, `dist`, `build`, `.next`, and `coverage`. It runs every rule and prints `file:line rule message`. It also checks the AGENTS.md block (see [AGENTS.md block](agents-md.md)). It exits 1 if a rule finds a violation or the block is stale or missing. With `--json` it returns `{ ok, violations, agentBlock }`.

Rules live in a table:

```ts
export const rules = { "no-raw-color": noRawColor } satisfies Record<string, Rule>;
```

A rule is `{ description, check(file, source) }` and returns findings with a line number. Adding a rule is one file and one table entry.

The same rules guard the system itself. `tests/registry.test.tsx` runs `no-raw-color` on every component.

Today there is one rule, `no-raw-color`. It flags hex, `rgb()`, `rgba()`, `hsl()`, and `hsla()` outside the token files.

Practices in docs can link to a rule with `rule: "no-raw-color"`. `RuleId` is the table's keys, so a link to a missing rule does not compile.

## Alternatives rejected

- **An ESLint plugin.** Ties the rules to one linter and its config format, and does not cover CSS. A rule here is a plain function.
- **Rules that need whole-app analysis.** "One primary button per view" has no reliable file-level definition of a view, so it stays a practice without a `rule`.

## Where in code

- Table and runner: [`registry/rules/index.ts`](../registry/rules/index.ts)
- Rule: [`registry/rules/no-raw-color.ts`](../registry/rules/no-raw-color.ts)
- Command: [`packages/cli/src/commands/check.ts`](../packages/cli/src/commands/check.ts)
- Test through the binary: `check` cases in [`tests/cli.test.ts`](../tests/cli.test.ts)

## In a fork

Add rules for your own system: no raw spacing values, a required `label` on inputs, no imports of a deprecated component. Write `registry/rules/<id>.ts`, add it to the table, and cover it in `tests/cli.test.ts` with one failing and one passing file. Run `paper check` in CI with a pinned version.
