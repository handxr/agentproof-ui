# A CLI for agents

## Problem

An agent working in an app needs to know which components exist, how to use one, and whether its code follows the rules. A skill or a long prompt file can carry that, but it is a copy. It goes stale, it costs context on every task, and it cannot check anything.

## Decision

The `paper` CLI is the interface. Agent instructions only point at it. See [AGENTS.md block](agents-md.md).

| Command | Does |
| --- | --- |
| `paper init [--dir <dir>]` | Writes `paper.json`, the token files and the AGENTS.md block |
| `paper add <name...>` | Copies components into the project |
| `paper list` | Lists components, marks installed ones |
| `paper docs <name>` | Summary, use, avoid, practices, props, examples |
| `paper tokens` | Token values |
| `paper check` | Lints the project against the rules |

Every command follows the same contract, so an agent never has to guess:

- **Non-interactive.** No prompts. Everything is a flag: `--registry`, `--dir`, `--json`.
- **`--json` on every command.** Output is one JSON document on stdout. Errors in JSON mode are `{"error": "..."}` on stdout.
- **Exit codes.** `0` means success. `1` means failure, such as an unknown component, a missing `paper.json`, or violations in `check`. `2` means a usage error, such as an unknown command or flag, or a missing argument.
- **Validated input.** The CLI parses `registry.json` and `paper.json` with zod at its boundary. A broken registry fails with a message, not a stack trace.

Commands are a table in [`index.ts`](../packages/cli/src/index.ts). Each command returns `{ json, text, exitCode? }`, and `main` decides how to print. No command writes to stdout itself.

## Alternatives rejected

- **Skills or rules files only.** Someone copies the text once, and it goes stale. A skill can say "no raw colors". `paper check` exits 1 when there is one.
- **An MCP server.** Needs setup per agent and per editor. Every coding agent can already run a shell command.
- **Interactive prompts (shadcn-style `init`).** An agent cannot answer a prompt reliably. Flags with defaults work for both people and agents.

## Where in code

- Entry, parsing, exit codes: [`packages/cli/src/index.ts`](../packages/cli/src/index.ts)
- Command contract: [`packages/cli/src/command.ts`](../packages/cli/src/command.ts)
- Commands: [`packages/cli/src/commands/`](../packages/cli/src/commands/)
- Boundary schemas: [`packages/cli/src/schema.ts`](../packages/cli/src/schema.ts)
- Tests that run the built binary on temp dirs: [`tests/cli.test.ts`](../tests/cli.test.ts)

## In a fork

Rename the bin in [`packages/cli/package.json`](../packages/cli/package.json) if you want your own command name. To add a command, write a `Command` in `commands/`, add it to the table, and test it through the binary in `tests/cli.test.ts`. Keep the contract: no prompts, `--json`, and exit codes 0, 1, and 2.
