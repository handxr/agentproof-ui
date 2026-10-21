import { defineDoc } from "@ds/core/define-doc";
import type { Input } from "./input";

export default defineDoc<typeof Input>({
  summary: "Single-line text field with a visible label, optional hint and error.",
  use: ["Short free text: name, email, search"],
  avoid: ["Multi-line text: use a textarea", "Choosing from a fixed list: use a select or radios"],
  practices: [
    { do: "Always pass a visible label; the component requires it." },
    { dont: "Use the placeholder as the label or to hold instructions; use hint." },
    { do: "Set type and autoComplete so browsers and password managers can help." },
    { do: "Write errors that say how to fix the value, not just that it is wrong." },
    { dont: "Color the field with raw values to show errors; pass error.", rule: "no-raw-color" },
  ],
  examples: {
    basic: () => import("./examples/basic"),
    "with-error": () => import("./examples/with-error"),
  },
  propNotes: { error: "Sets aria-invalid and links the message with aria-describedby." },
});
