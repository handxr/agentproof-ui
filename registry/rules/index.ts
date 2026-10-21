import { noRawColor } from "./no-raw-color.ts";
import type { Rule, Violation } from "./types.ts";

export const rules = { "no-raw-color": noRawColor } satisfies Record<string, Rule>;
export type RuleId = keyof typeof rules;
export type { Rule, Violation };

export function runRules(file: string, source: string): Violation[] {
  return Object.entries(rules).flatMap(([rule, r]) => r.check(file, source).map((f) => ({ rule, file, ...f })));
}
