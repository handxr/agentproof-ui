# Tokens

## Problem

Agents invent values. Ask one for a card and you get `#333`, `padding: 13px` and a font stack nobody chose. Each value looks fine on its own, and together they drift from the system.

## Decision

[`tokens/tokens.json`](../tokens/tokens.json) is the only place a token value is written. Groups are `color`, `font`, `fontSize`, `fontWeight`, `lineHeight`, `space`, `radius` and `size`. Each color has a `light` and a `dark` value.

[`tokens/build.ts`](../tokens/build.ts) generates two files from it:

- `registry/components/tokens.stylex.ts`: one `stylex.defineVars` per group. Components import from here. Dark values become a `@media (prefers-color-scheme: dark)` value on each color variable.
- `tokens/tokens.css`: `--paper-<group>-<key>` CSS variables, for code that does not use StyleX.

`paper tokens` prints the values, and `paper tokens --json` returns the token tree.

## Alternatives rejected

- **Tokens written directly in TypeScript.** Works for StyleX, but every other output would have to parse TypeScript. JSON is readable by any tool and by `paper tokens`.
- **A token for every value that appears once.** The rule in [`AGENTS.md`](../AGENTS.md) is no new token without a real use in a component.
- **Tailwind config as the source.** It ties the system to Tailwind. StyleX vars and CSS variables cover both cases.

## Where in code

- Source: [`tokens/tokens.json`](../tokens/tokens.json)
- Generator: [`tokens/build.ts`](../tokens/build.ts)
- Outputs: [`registry/components/tokens.stylex.ts`](../registry/components/tokens.stylex.ts), [`tokens/tokens.css`](../tokens/tokens.css)

## In a fork

Replace the values in `tokens.json` and run `pnpm generate`. Rename or add groups if you need to, but every group name is an export that components import, so update the components in the same commit. `pnpm check` fails until the generated files match.
