# AGENTS.md block

## Problem

An agent only uses the CLI if it knows the CLI exists. It also needs project facts that no registry knows: where components were copied, which are installed, which bundler plugin is required.

## Decision

`paper init` writes a short block into the project's agent file, between two markers:

```md
<!-- paper:start -->
## Design system (paper)
...
- Before building UI, check what exists: `npx paper list`.
- Before using a component, read its rules and props: `npx paper docs <name>`.
- Add components with `npx paper add <name>`. Do not copy or rewrite them by hand.
...
- Installed: button, input.
<!-- paper:end -->
```

See the full block in [`apps/example/AGENTS.md`](../apps/example/AGENTS.md).

The block is short on purpose. It points at commands and lists facts. Component guidance stays in the CLI.

- **Managed.** Only the text between the markers belongs to `paper`. If the file exists, `init` replaces the block in place or appends it. Everything outside is untouched.
- **Idempotent.** Running `init` or `add` twice gives byte-identical files. `add` and `update` re-render the block with the new installed list.
- **Checked.** `paper check` exits 1 when the block differs from what the current registry and `paper.json` would write, and suggests `paper update`. It also exits 1, with `agentBlock: "malformed"`, when a marker is missing or the end marker comes first. `init`, `add` and `update` refuse to touch a malformed block, so a broken marker never costs the user the text below it.
- **Agent file.** The CLI writes to `CLAUDE.md` if it exists and `AGENTS.md` does not. Otherwise it writes to `AGENTS.md`.

The block includes setup gotchas found while building the example. StyleX needs its bundler plugin, and the entry must import at least one CSS file. Without a CSS import, the build has no stylesheet for StyleX to add its CSS to, and components render unstyled.

## Alternatives rejected

- **Overwrite `AGENTS.md`.** Destroys the project's own rules.
- **Write a separate `PAPER.md`.** Agents read `AGENTS.md` or `CLAUDE.md` by convention, not arbitrary files.
- **Put full component docs in the block.** Costs context on every task and goes stale. `paper docs` is read only when needed.

## Where in code

- Block text, markers and file choice: [`packages/cli/src/project.ts`](../packages/cli/src/project.ts)
- Idempotency and `CLAUDE.md` tests: [`tests/cli.test.ts`](../tests/cli.test.ts)

## In a fork

Edit `agentBlock` in `project.ts`. Keep each line a command or a fact the agent cannot get elsewhere. Change the markers only if you rename the CLI, since existing projects need the old markers to update in place.
