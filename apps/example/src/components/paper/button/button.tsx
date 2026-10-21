import * as stylex from "@stylexjs/stylex";
import type { ButtonHTMLAttributes } from "react";
import { color, font, fontSize, fontWeight, radius, space } from "../tokens.stylex";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** `primary` for the main action of a view, `secondary` for everything else. */
  variant?: "primary" | "secondary";
};

export function Button({ variant = "primary", type = "button", ...props }: ButtonProps) {
  return <button type={type} {...props} {...stylex.props(styles.base, styles[variant])} />;
}

const styles = stylex.create({
  base: {
    fontFamily: font.sans,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    lineHeight: 1,
    paddingBlock: space.sm,
    paddingInline: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "solid",
    cursor: { default: "pointer", ":disabled": "not-allowed" },
    opacity: { default: 1, ":disabled": 0.5 },
    outline: { default: "none", ":focus-visible": `2px solid ${color.fg}` },
    outlineOffset: "3px",
  },
  primary: {
    backgroundColor: color.fg,
    color: color.bg,
    borderColor: color.fg,
  },
  secondary: {
    backgroundColor: { default: "transparent", ":hover": color.surface },
    color: color.fg,
    borderColor: color.rule,
  },
});
