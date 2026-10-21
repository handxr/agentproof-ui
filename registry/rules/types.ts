export type Violation = { rule: string; file: string; line: number; message: string };
export type Finding = { line: number; message: string };
export type Rule = { description: string; check: (file: string, source: string) => Finding[] };
