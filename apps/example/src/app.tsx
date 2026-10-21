import * as stylex from "@stylexjs/stylex";
import { Button } from "./components/paper/button/button";
import { Input } from "./components/paper/input/input";
import { color, font, fontSize, lineHeight, size, space } from "./components/paper/tokens.stylex";

const s = stylex.create({
  root: { minHeight: "100vh", backgroundColor: color.bg, color: color.fg, fontFamily: font.sans, lineHeight: lineHeight.body },
  page: { maxWidth: size.column, marginInline: "auto", paddingBlock: space["3xl"], paddingInline: space.lg, display: "flex", flexDirection: "column", gap: space.lg },
  title: { margin: 0, fontSize: fontSize.lg, lineHeight: lineHeight.tight },
  lead: { margin: 0, color: color.muted },
  actions: { display: "flex", gap: space.md },
});

export function App() {
  return (
    <div {...stylex.props(s.root)}>
      <main {...stylex.props(s.page)}>
        <h1 {...stylex.props(s.title)}>Contact</h1>
        <p {...stylex.props(s.lead)}>Built with paper components, copied in by the paper CLI.</p>
        <Input label="Email" type="email" hint="We only use it to reply." />
        <Input label="Name" error="Enter your name." />
        <div {...stylex.props(s.actions)}>
          <Button type="submit">Send message</Button>
          <Button variant="secondary">Cancel</Button>
        </div>
      </main>
    </div>
  );
}
