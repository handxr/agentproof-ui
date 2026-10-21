import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { Button } from "./button";

test("defaults to type=button so it never submits a form by accident", () => {
  render(<Button>Save</Button>);
  expect(screen.getByRole("button", { name: "Save" }).getAttribute("type")).toBe("button");
});

test("calls onClick, and not when disabled", () => {
  const onClick = vi.fn();
  const { rerender } = render(<Button onClick={onClick}>Save</Button>);
  fireEvent.click(screen.getByRole("button"));
  rerender(<Button onClick={onClick} disabled>Save</Button>);
  fireEvent.click(screen.getByRole("button"));
  expect(onClick).toHaveBeenCalledTimes(1);
});

test("primary and secondary render different styles", () => {
  render(<><Button>A</Button><Button variant="secondary">B</Button></>);
  const [a, b] = screen.getAllByRole("button");
  expect(a.className).not.toBe("");
  expect(a.className).not.toBe(b.className);
});
