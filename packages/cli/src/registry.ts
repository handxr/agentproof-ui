import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { registrySchema, type Registry } from "./schema.ts";

export const DEFAULT_REGISTRY = "github:handxr/agentproof-ui";

export function registryUrl(source: string): string {
  const gh = /^github:([^/#]+\/[^/#]+)(?:#(.+))?$/.exec(source);
  if (gh) return `https://raw.githubusercontent.com/${gh[1]}/${gh[2] ?? "main"}/registry/registry.json`;
  return source;
}

export async function loadRegistry(source: string): Promise<Registry> {
  const url = registryUrl(source);
  let raw: string;
  if (/^https?:\/\//.test(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`registry ${url}: HTTP ${res.status}`);
    raw = await res.text();
  } else {
    const path = resolve(url);
    const file = existsSync(path) && statSync(path).isDirectory() ? resolve(path, "registry/registry.json") : path;
    if (!existsSync(file)) throw new Error(`registry not found: ${file}`);
    raw = readFileSync(file, "utf8");
  }
  const parsed = registrySchema.safeParse(JSON.parse(raw));
  if (!parsed.success) throw new Error(`invalid registry ${url}: ${parsed.error.issues.map((i) => `${i.path.join(".") || "registry"}: ${i.message}`).join("; ")}`);
  return parsed.data;
}
