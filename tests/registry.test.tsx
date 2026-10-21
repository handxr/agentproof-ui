import { existsSync, readdirSync, readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { registrySchema } from "../packages/cli/src/schema.ts";
import { rules } from "../registry/rules/index.ts";
import { componentNames } from "../scripts/build-registry.ts";

const dir = import.meta.dirname + "/../registry/components/";
const registry = registrySchema.parse(JSON.parse(readFileSync(import.meta.dirname + "/../registry/registry.json", "utf8")));

test("registry.json lists every component folder", () => {
  expect(registry.components.map((c) => c.name)).toEqual(componentNames());
});

describe.each(componentNames())("%s", (name) => {
  test("has component, docs, test and at least one example", () => {
    for (const f of [`${name}.tsx`, `${name}.docs.ts`, `${name}.test.tsx`]) expect(existsSync(`${dir}${name}/${f}`), f).toBe(true);
    expect(readdirSync(`${dir}${name}/examples`).length).toBeGreaterThan(0);
  });

  test("every example file is listed in docs and renders", async () => {
    const doc = (await import(`../registry/components/${name}/${name}.docs.ts`)).default;
    const listed = Object.values(doc.examples).length;
    expect(listed).toBe(readdirSync(`${dir}${name}/examples`).length);
    for (const load of Object.values(doc.examples) as (() => Promise<{ default: React.ComponentType }>)[]) {
      const { default: Example } = await load();
      const { container, unmount } = render(<Example />);
      expect(container.innerHTML).not.toBe("");
      unmount();
    }
  });

  test("every practice rule exists in ds check", () => {
    const entry = registry.components.find((c) => c.name === name)!;
    for (const p of entry.practices) if (p.rule) expect(Object.keys(rules)).toContain(p.rule);
  });

  test("component styles only use tokens", () => {
    expect(rules["no-raw-color"].check(`${name}.tsx`, readFileSync(`${dir}${name}/${name}.tsx`, "utf8"))).toEqual([]);
  });
});
