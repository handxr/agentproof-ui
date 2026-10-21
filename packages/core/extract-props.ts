import { withCustomConfig } from "react-docgen-typescript";

export type PropInfo = { name: string; type: string; required: boolean; default?: string; description: string };

/** Props declared by the component itself (inherited DOM props are skipped). */
export function extractProps(file: string, tsconfig: string): PropInfo[] {
  const parser = withCustomConfig(tsconfig, {
    shouldExtractLiteralValuesFromEnum: true,
    savePropValueAsString: true,
    propFilter: (p) => !p.parent || !p.parent.fileName.includes("node_modules"),
  });
  const [doc] = parser.parse(file);
  if (!doc) throw new Error(`no component found in ${file}`);
  return Object.values(doc.props)
    .map((p) => ({
      name: p.name,
      type: p.type.name,
      required: p.required,
      ...(p.defaultValue?.value !== undefined ? { default: String(p.defaultValue.value) } : {}),
      description: p.description,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
