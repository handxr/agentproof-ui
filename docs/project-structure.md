# Project structure

## Problem

A design system for agents has more moving parts than a component library: token sources, component docs, lint rules, a CLI, and generated indexes. If they live in separate repos, a fork takes one piece and loses the rest.

## Decision

One pnpm workspace holds everything. A fork copies the whole system in one step.

```
agentproof-ui/
  tokens/
    tokens.json          # token source
    build.ts             # writes tokens.stylex.ts and tokens.css
    tokens.css*
  registry/
    components/
      tokens.stylex.ts*  # stylex.defineVars, copied into projects
      button/
        button.tsx       # the component
        button.docs.ts   # typed docs (defineDoc)
        button.test.tsx  # behavior tests
        examples/*.tsx   # real, rendered examples
      input/
    rules/               # paper check rules
    registry.json*       # everything the CLI serves
  packages/
    core/                # defineDoc, extractProps
    cli/                 # the paper CLI
  scripts/
    build-registry.ts    # writes registry.json, llms.txt, llms-full.txt
  apps/
    example/             # Vite app that consumes paper through the CLI
  tests/                 # registry and CLI tests
  docs/                  # these guides
  llms.txt*  llms-full.txt*
  AGENTS.md  DESIGN.md
```

`*` marks generated files. See [Generated files](generated-files.md).

Code flows one way: `tokens.json` and `registry/components/*` feed `scripts/build-registry.ts`, which writes `registry.json`. The CLI reads only `registry.json`.

## Alternatives rejected

- **Separate repos for the CLI, tokens, and components.** Versions drift, and a fork needs three repos.
- **A published component package.** See [Distribution](distribution.md).

## Where in code

- Workspace: [`pnpm-workspace.yaml`](../pnpm-workspace.yaml)
- Data shapes: [`DESIGN.md`](../DESIGN.md)
- Scripts: [`package.json`](../package.json)

## In a fork

Keep the layout. Replace the contents of `tokens/tokens.json` and `registry/components/`. The CLI, tests, and generators work on whatever is there.
