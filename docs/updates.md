# Updates

## Problem

A copied component belongs to the project, so people edit it. When the registry ships a new version, the CLI has to tell an edited file from an untouched one. Before this change it could not. `paper add button` overwrote `button.tsx` with no warning, and an agent running that command could delete someone's work without knowing it.

## Decision

`paper.json` records what the CLI wrote. For each installed component, and for the token files, it stores the sha256 of every file as written:

```json
{
  "installed": {
    "button": { "files": { "src/components/paper/button/button.tsx": "c78fe0..." } }
  },
  "tokens": { "files": { "src/components/paper/tokens.stylex.ts": "..." } }
}
```

Before writing a file, the CLI compares three things: the file on disk, its recorded hash, and the registry content. That gives each file one status:

| Status | Meaning | `add` / `init` | `update` |
| --- | --- | --- | --- |
| `new` | Not on disk | Writes it | Writes it |
| `unchanged` | Already equals the registry | Leaves it | Leaves it |
| `clean` | Equals what paper last wrote | Replaces it | Replaces it |
| `modified` | Changed locally, or present with no record and different from the registry | Fails, writes nothing | Skips it and exits 1 |

`--force` overwrites `modified` files in every command.

`paper update [name...]` updates the named components, or every installed component and the token files when you name none. It prints `updated`, `unchanged` and `skipped`, with `--json` for agents. It exits 1 when it skipped a file, so an agent cannot read a partial update as success. It also rewrites the AGENTS.md block.

`paper check` compares the AGENTS.md block with the block that the current registry and `paper.json` would produce. If they differ, it reports `agentBlock: "stale"` and exits 1. A project that never reruns the CLI still finds out when the block text changes upstream.

Old `paper.json` files with `installed` as a list of names still parse. Those components have no recorded files, so a file that differs from the registry counts as `modified`. The first `update` or `add` writes the new form.

## Alternatives rejected

- **A versioned npm package.** It fixes updates by taking away ownership of the code. See [Distribution](distribution.md).
- **Overwrite without checking.** It was the old behavior, and it loses local changes with no warning. Agents run `add` often, so this happens in practice.
- **A `paper diff` command.** After `paper update`, `git diff` shows what changed, and `git checkout` reverts it. A diff command would be one more command to maintain for the same result.
- **Merge local changes with the new version.** Three-way merges need the old registry content, which the CLI does not keep, and a bad merge is worse than a skipped file. The person or agent resolves the skipped file and reruns with `--force`.

## Where in code

- Hashes, file statuses and writes: `planFiles`, `applyPlan` and `assertNoConflicts` in [`packages/cli/src/project.ts`](../packages/cli/src/project.ts)
- Config shape and the old-form migration: [`packages/cli/src/schema.ts`](../packages/cli/src/schema.ts)
- Commands: [`commands/update.ts`](../packages/cli/src/commands/update.ts), [`commands/add.ts`](../packages/cli/src/commands/add.ts), [`commands/check.ts`](../packages/cli/src/commands/check.ts)
- Tests: [`tests/cli.test.ts`](../tests/cli.test.ts)

## In a fork

Nothing to change. If you add a file type that the CLI writes, record its hash through `applyPlan` so `update` can tell whether someone edited it.
