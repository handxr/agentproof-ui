import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Input } from "./input";

test("the label names the field", () => {
  render(<Input label="Email" />);
  expect(screen.getByRole("textbox", { name: "Email" })).toBeTruthy();
});

test("hint describes the field and it stays valid", () => {
  render(<Input label="Email" hint="We only use it to reply." />);
  const field = screen.getByRole("textbox");
  expect(field.getAttribute("aria-invalid")).toBeNull();
  expect(document.getElementById(field.getAttribute("aria-describedby")!)?.textContent).toBe("We only use it to reply.");
});

test("error marks the field invalid and replaces the hint", () => {
  render(<Input label="Email" hint="hint" error="Enter a full email address." />);
  const field = screen.getByRole("textbox");
  expect(field.getAttribute("aria-invalid")).toBe("true");
  expect(document.getElementById(field.getAttribute("aria-describedby")!)?.textContent).toBe("Enter a full email address.");
  expect(screen.queryByText("hint")).toBeNull();
});
