import { z } from "zod";

const file = z.object({ path: z.string(), content: z.string() });
const practice = z.union([z.object({ do: z.string() }), z.object({ dont: z.string() })]).and(z.object({ rule: z.string().optional() }));
const prop = z.object({ name: z.string(), type: z.string(), required: z.boolean(), default: z.string().optional(), description: z.string(), note: z.string().optional() });

export const registrySchema = z.object({
  version: z.string(),
  tokens: z.array(file),
  tokenValues: z.record(z.string(), z.record(z.string(), z.union([z.string(), z.object({ light: z.string(), dark: z.string() })]))),
  components: z.array(
    z.object({
      name: z.string(),
      summary: z.string(),
      use: z.array(z.string()),
      avoid: z.array(z.string()),
      practices: z.array(practice),
      props: z.array(prop),
      examples: z.array(z.object({ name: z.string(), code: z.string() })),
      dependencies: z.array(z.string()),
      files: z.array(file),
    }),
  ),
});

// path (relative to the project) -> sha256 of the content paper wrote there
const written = z.object({ files: z.record(z.string(), z.string()) });
const legacyInstalled = z.array(z.string()).transform((names) => Object.fromEntries(names.map((n) => [n, { files: {} }])));

export const configSchema = z.object({
  registry: z.string(),
  componentsDir: z.string(),
  // Old configs stored only names. They read as installed with no recorded files.
  installed: z.union([legacyInstalled, z.record(z.string(), written)]),
  tokens: written.default({ files: {} }),
});

export type Registry = z.infer<typeof registrySchema>;
export type RegistryEntry = Registry["components"][number];
export type RegistryFile = z.infer<typeof file>;
export type PaperConfig = z.output<typeof configSchema>;
export type Written = z.infer<typeof written>;
