import { readConfig } from "./project.ts";

export type Flags = { json?: boolean; registry?: string; dir?: string };
export type Command = (ctx: { cwd: string; args: string[]; flags: Flags }) => Promise<{ json: unknown; text: string; exitCode?: number }>;

export class UsageError extends Error {}

export function requireConfig(cwd: string) {
  const config = readConfig(cwd);
  if (!config) throw new Error("no paper.json here; run `paper init` first");
  return config;
}
