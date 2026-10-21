import { transformAsync } from "@babel/core";
import stylexBabel from "@stylexjs/babel-plugin";
import type { Plugin } from "vite";

// Tests run in jsdom, so styles are injected at runtime instead of extracted to a CSS file.
export function stylexTestPlugin(rootDir: string): Plugin {
  return {
    name: "stylex-test",
    enforce: "pre",
    async transform(code, id) {
      if (!/\.[jt]sx?$/.test(id) || id.includes("node_modules") || !code.includes("@stylexjs/stylex")) return null;
      const out = await transformAsync(code, {
        filename: id,
        babelrc: false,
        configFile: false,
        parserOpts: { plugins: ["typescript", "jsx"] },
        plugins: [stylexBabel.withOptions({ dev: true, runtimeInjection: true, unstable_moduleResolution: { type: "commonJS", rootDir } })],
      });
      return out?.code ? { code: out.code } : null;
    },
  };
}
