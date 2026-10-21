# Generated files

## Problem

The registry, the LLM indexes, and the token outputs repeat information from the source files. Copies written by hand go stale the first time someone forgets one.

## Decision

The generators write these files. Never edit them by hand:

| File | Generated from | By |
| --- | --- | --- |
| `registry/components/tokens.stylex.ts` | `tokens/tokens.json` | `tokens/build.ts` |
| `tokens/tokens.css` | `tokens/tokens.json` | `tokens/build.ts` |
| `registry/registry.json` | components, docs, types, tokens | `scripts/build-registry.ts` |
| `llms.txt` | `registry.json` data | `scripts/build-registry.ts` |
| `llms-full.txt` | `registry.json` data | `scripts/build-registry.ts` |

`pnpm generate` writes them. Both generators also take `--check`, which compares instead of writing and exits 1 with `stale: <file> (run pnpm generate)`. `pnpm check` runs `check:generated`, so a stale file fails the same command as a type error.

`registry.json` embeds the file contents of each component, so a remote registry is one fetch.

`llms.txt` is a short index for LLMs: components with summaries, tokens, and rules. `llms-full.txt` adds every component's docs, props and examples in one file, for agents that read a repo without installing the CLI.

## Alternatives rejected

- **Generate in CI only, do not commit.** A `github:` registry is a raw file URL. The file has to be in the repo.
- **Generate on install.** The work is hidden, and a fork that never runs it serves an old registry.

## Where in code

- [`tokens/build.ts`](../tokens/build.ts)
- [`scripts/build-registry.ts`](../scripts/build-registry.ts)
- `generate` and `check:generated` in [`package.json`](../package.json)

## In a fork

Run `pnpm generate` after any change to tokens, components, or docs, and commit the outputs with the change. If you add an output, add it to the `outputs` object of its generator, so `--check` covers it.
