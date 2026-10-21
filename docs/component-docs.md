# Component docs

## Problem

Docs drift. A markdown page says `<Button kind="primary">` long after the prop became `variant`. People notice and skip the docs. Agents believe them and write broken code.

## Decision

Each component has a `<name>.docs.ts` that calls `defineDoc`:

```ts
export default defineDoc<typeof Button>({
  summary: "Triggers an action in place: submit a form, open a dialog, save.",
  use: ["Submitting a form"],
  avoid: ["Navigating to another page: use a link"],
  practices: [
    { do: "Use one primary button per view; make the rest secondary." },
    { dont: "Restyle it with raw colors; extend the variants with color tokens.", rule: "no-raw-color" },
  ],
  examples: { primary: () => import("./examples/primary") },
  propNotes: { disabled: "Prefer explaining why an action is unavailable over a silent disabled button." },
});
```

The compiler checks it:

- A missing `summary`, `use`, `avoid`, `practices` or `examples` is a type error.
- `examples` are real dynamic imports, so a wrong path is a type error.
- `propNotes` keys must be props of `typeof Button`. Remove a prop and the note stops compiling.
- `rule` must be a key of the rules table, so a practice cannot point at a rule that does not exist.

Props are not written by hand. [`extract-props.ts`](../packages/core/extract-props.ts) reads them from the component's TypeScript types and JSDoc with `react-docgen-typescript`. Props inherited from DOM types are skipped.

[`tests/registry.test.tsx`](../tests/registry.test.tsx) renders every example and fails if an example file exists that the docs do not list.

## Alternatives rejected

- **Markdown or MDX.** Nothing ties it to the component's types. A renamed prop leaves the page wrong and the build green.
- **Storybook stories as docs.** Good for humans, but an agent needs `use`, `avoid`, and practices, which stories do not have.
- **Prop tables written by hand.** They duplicate the types and go stale.

## Where in code

- Type and helper: [`packages/core/define-doc.ts`](../packages/core/define-doc.ts)
- Example: [`registry/components/button/button.docs.ts`](../registry/components/button/button.docs.ts)
- Consumers: [`scripts/build-registry.ts`](../scripts/build-registry.ts) turns docs into `registry.json` and `llms*.txt`. `paper docs <name>` prints them.

## In a fork

Keep `defineDoc` and the fields. If you need more fields (for example `a11y`), add them to `Doc` in `define-doc.ts`, to the registry schema in `packages/cli/src/schema.ts`, and to `buildEntry` in `build-registry.ts`. The compiler then shows you every doc that needs updating.
