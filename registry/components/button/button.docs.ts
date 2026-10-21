import { defineDoc } from "@paper/core/define-doc";
import type { Button } from "./button";

export default defineDoc<typeof Button>({
  summary: "Triggers an action in place: submit a form, open a dialog, save.",
  use: ["Submitting a form", "Confirming or cancelling an action"],
  avoid: ["Navigating to another page: use a link", "Decoration or labels with no action"],
  practices: [
    { do: "Use one primary button per view; make the rest secondary." },
    { do: "Write the label as a verb that says what happens: 'Send message', not 'OK'." },
    { do: "Set type=\"submit\" explicitly for form submission; the default is type=\"button\"." },
    { dont: "Restyle it with raw colors; extend the variants with color tokens.", rule: "no-raw-color" },
  ],
  examples: {
    primary: () => import("./examples/primary"),
    secondary: () => import("./examples/secondary"),
  },
  propNotes: { disabled: "Prefer explaining why an action is unavailable over a silent disabled button." },
});
