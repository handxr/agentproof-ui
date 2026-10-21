import * as stylex from "@stylexjs/stylex";
import { useId, type InputHTMLAttributes } from "react";
import { color, font, fontSize, radius, space } from "../tokens.stylex";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  /** Visible label. Required: placeholders are not labels. */
  label: string;
  /** Help text under the field. */
  hint?: string;
  /** Error message. Marks the field invalid and replaces the hint. */
  error?: string;
};

export function Input({ label, hint, error, ...props }: InputProps) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? hint;
  return (
    <div {...stylex.props(styles.field)}>
      <label htmlFor={id} {...stylex.props(styles.label)}>{label}</label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        {...props}
        {...stylex.props(styles.input, error ? styles.invalid : null)}
      />
      {note && <span id={noteId} {...stylex.props(styles.note, error ? styles.error : null)}>{note}</span>}
    </div>
  );
}

const styles = stylex.create({
  field: { display: "flex", flexDirection: "column", gap: space.xs, fontFamily: font.sans },
  label: { fontSize: fontSize.sm, color: color.fg },
  input: {
    fontFamily: font.sans,
    fontSize: fontSize.md,
    color: color.fg,
    backgroundColor: color.bg,
    paddingBlock: space.sm,
    paddingInline: space.md,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: { default: color.rule, ":focus-visible": color.fg },
    borderRadius: radius.md,
    outline: "none",
  },
  invalid: { borderColor: color.danger },
  note: { fontSize: fontSize.sm, color: color.muted },
  error: { color: color.danger },
});
