import { add } from "./commands/add.ts";
import { check } from "./commands/check.ts";
import { docs } from "./commands/docs.ts";
import { init } from "./commands/init.ts";
import { list } from "./commands/list.ts";
import { tokens } from "./commands/tokens.ts";
import { UsageError, type Command, type Flags } from "./command.ts";

const commands: Record<string, Command> = { init, add, list, docs, tokens, check };

const USAGE = `usage: paper <command> [--json] [--registry <path|url|github:user/repo>]
  init [--dir <componentsDir>]  write paper.json, tokens and the AGENTS.md section
  add <name...>                 copy components into your project
  list                          components in the registry
  docs <name>                   summary, use/avoid, practices, props, examples
  tokens                        design tokens
  check                         lint the project against the system (exit 1 on violations)`;

function parse(argv: string[]): { command?: string; args: string[]; flags: Flags } {
  const flags: Flags = {};
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") flags.json = true;
    else if (a === "--registry" || a === "--dir") {
      const value = argv[++i];
      if (!value) throw new UsageError(`${a} needs a value`);
      flags[a.slice(2) as "registry" | "dir"] = value;
    } else if (a.startsWith("--")) throw new UsageError(`unknown option ${a}`);
    else rest.push(a);
  }
  const [command, ...args] = rest;
  return { command, args, flags };
}

async function main(): Promise<number> {
  let json = process.argv.includes("--json");
  try {
    const { command, args, flags } = parse(process.argv.slice(2));
    json = !!flags.json;
    const run = command && commands[command];
    if (!run) throw new UsageError(command ? `unknown command "${command}"\n${USAGE}` : USAGE);
    const result = await run({ cwd: process.cwd(), args, flags });
    console.log(json ? JSON.stringify(result.json, null, 2) : result.text);
    return result.exitCode ?? 0;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (json) console.log(JSON.stringify({ error: message }));
    else console.error(message);
    return e instanceof UsageError ? 2 : 1;
  }
}

process.exitCode = await main();
