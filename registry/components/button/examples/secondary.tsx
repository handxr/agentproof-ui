import { Button } from "../button";

export default function Secondary() {
  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      <Button type="submit">Save</Button>
      <Button variant="secondary">Cancel</Button>
    </div>
  );
}
