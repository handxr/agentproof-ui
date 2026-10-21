# Components

## Problem

An agent copies whatever pattern it sees first. If one component is styled with inline styles and another with tokens, both patterns spread.

## Decision

Every component has the same folder shape, and a test enforces it:

```
registry/components/button/
  button.tsx        # one exported component
  button.docs.ts    # defineDoc<typeof Button>({...})
  button.test.tsx   # behavior through the DOM
  examples/
    primary.tsx
    secondary.tsx
```

Rules for `<name>.tsx`:

- Style with `stylex.create` and tokens from `../tokens.stylex` only.
- Put a JSDoc comment on each prop. It becomes the prop description in `paper docs`.
- Import only `react`, `@stylexjs/stylex` and the token file. The build lists every other bare import as a dependency that `paper add` reports.

Tests assert what a user can observe: roles, labels and attributes, not class names. See [`button.test.tsx`](../registry/components/button/button.test.tsx).

## Alternatives rejected

- **Free-form folders.** An agent cannot tell what a complete component looks like.
- **Snapshot tests.** They fail on every style change and pass when behavior breaks.

## Where in code

- Components: [`registry/components/`](../registry/components/)
- Shape test: [`tests/registry.test.tsx`](../tests/registry.test.tsx). It fails if a folder misses its component, docs, test or examples, if an example is not listed in the docs or does not render, or if the component file contains a raw color.

## In a fork

Delete `button/` and `input/` once you have your own components, and keep the folder shape. To add one, follow "Adding a component" in [`AGENTS.md`](../AGENTS.md), then run `pnpm generate && pnpm check`.
