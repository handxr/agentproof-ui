import type { ComponentProps, ComponentType, JSXElementConstructor } from "react";
import type { RuleId } from "../../registry/rules/index.ts";


export type Practice = ({ do: string; dont?: never } | { dont: string; do?: never }) & { rule?: RuleId };


export type ExampleLoader = () => Promise<{ default: ComponentType }>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Doc<C extends JSXElementConstructor<any>> = {
  summary: string;
  use: string[];
  avoid: string[];
  practices: Practice[];
  examples: Record<string, ExampleLoader>;
  // Keys must be real props, so removing a prop breaks the doc.
  propNotes?: Partial<Record<keyof ComponentProps<C>, string>>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function defineDoc<C extends JSXElementConstructor<any>>(doc: Doc<C>): Doc<C> {
  return doc;
}
