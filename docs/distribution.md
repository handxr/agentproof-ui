# Distribution

## Problem

A component installed from `node_modules` is a black box. Agents can read only the type declarations, and changing a component means a fork of the package or a wrapper around it.

## Decision

`paper add` copies the component source into the project, as shadcn does. The project owns the copy.

1. `paper init` writes `paper.json` and copies `tokens.stylex.ts` and `tokens.css` into `componentsDir` (default `src/components/paper`).
2. `paper add button` copies `button/button.tsx` and prints the npm dependencies it needs.
3. `paper update` brings copies up to date with the registry and skips files changed locally. See [Updates](updates.md).

The registry is a source string in `paper.json` or `--registry`:

- `github:user/repo` or `github:user/repo#branch` reads `registry/registry.json` from `raw.githubusercontent.com` (default branch `main`).
- An `http(s)://` URL to a `registry.json`.
- A local path to a repo or to a `registry.json`. `apps/example` uses `../..`.

The default is `github:handxr/agentproof-ui`. To use a fork, point the CLI at it. The CLI code does not change.

```sh
paper init --registry github:you/agentproof-ui
```

The CLI itself is not meant to be a project dependency. Run it with `npx`, and pin it as a `devDependency` only where `paper check` runs in CI. The CLI is not on npm yet. Today it runs from a clone with `node packages/cli/dist/paper.js`.

## Alternatives rejected

- **A versioned component package.** Upgrades are all or nothing, local changes need wrappers, and agents cannot read the source.
- **Copy by hand.** No record of what is installed, and no way for `check` or the AGENTS.md block to know.

## Where in code

- Registry sources: [`packages/cli/src/registry.ts`](../packages/cli/src/registry.ts)
- Updates: [Updates](updates.md)
- Copy and config: [`packages/cli/src/project.ts`](../packages/cli/src/project.ts), [`commands/add.ts`](../packages/cli/src/commands/add.ts), [`commands/init.ts`](../packages/cli/src/commands/init.ts)
- Consumer: [`apps/example/paper.json`](../apps/example/paper.json)

## In a fork

Change `DEFAULT_REGISTRY` in `registry.ts` to your repo, so `paper init` works without `--registry`. `add` and `update` skip files changed locally, so local changes survive updates. Keep them small, or move them into your registry.
