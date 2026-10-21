import type { Rule } from "./types.ts";

const COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/g;
const TOKEN_FILES = /tokens\.(stylex\.ts|css)$/;

export const noRawColor: Rule = {
  description: "Colors must come from design tokens (color.* in tokens.stylex.ts), not raw hex/rgb/hsl values.",
  check(file, source) {
    if (TOKEN_FILES.test(file)) return [];
    return source.split("\n").flatMap((text, i) =>
      [...text.matchAll(COLOR)].map((m) => ({ line: i + 1, message: `raw color "${m[0]}"; use a color token` })),
    );
  },
};
