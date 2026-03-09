import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function makeInvocation(
  toolName: string,
  args: Record<string, unknown>,
  state: "partial-call" | "call" | "result" = "call",
  result?: unknown
): ToolInvocation {
  if (state === "result") {
    return { toolCallId: "id", toolName, args, state, result } as ToolInvocation;
  }
  return { toolCallId: "id", toolName, args, state } as ToolInvocation;
}

// str_replace_editor commands
test("shows 'Reading <file>' for view command", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "view", path: "/src/App.tsx" })} />);
  expect(screen.getByText("Reading App.tsx")).toBeDefined();
});

test("shows 'Creating <file>' for create command", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/src/Button.tsx" })} />);
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("shows 'Editing <file>' for str_replace command", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "/src/App.tsx" })} />);
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

test("shows 'Editing <file>' for insert command", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "insert", path: "/src/App.tsx" })} />);
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

test("shows 'Undoing edit' for undo_edit command", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "undo_edit", path: "/src/App.tsx" })} />);
  expect(screen.getByText("Undoing edit")).toBeDefined();
});

// file_manager commands
test("shows 'Renaming <file>' for rename command", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("file_manager", { command: "rename", path: "/src/Old.tsx" })} />);
  expect(screen.getByText("Renaming Old.tsx")).toBeDefined();
});

test("shows 'Deleting <file>' for delete command", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("file_manager", { command: "delete", path: "/src/Old.tsx" })} />);
  expect(screen.getByText("Deleting Old.tsx")).toBeDefined();
});

// Fallback cases
test("shows 'Working...' for unknown tool", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("unknown_tool", { command: "do_something" })} />);
  expect(screen.getByText("Working...")).toBeDefined();
});

test("shows 'Working...' for unknown str_replace_editor command", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "unknown" })} />);
  expect(screen.getByText("Working...")).toBeDefined();
});

test("shows 'Working...' for unknown file_manager command", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("file_manager", { command: "unknown" })} />);
  expect(screen.getByText("Working...")).toBeDefined();
});

test("shows 'Working...' when command is missing (partial-call)", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", {}, "partial-call")} />);
  expect(screen.getByText("Working...")).toBeDefined();
});

// Filename edge cases
test("handles trailing slash in path", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/src/Button.tsx/" })} />);
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("handles bare filename without directory", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "view", path: "App.tsx" })} />);
  expect(screen.getByText("Reading App.tsx")).toBeDefined();
});

// Visual states
test("shows spinner when state is call (pending)", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/src/Button.tsx" }, "call")} />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows green dot when state is result with result present", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/src/Button.tsx" }, "result", "Success")} />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when state is result but result is null", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/src/Button.tsx" }, "result", null)} />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

// Badge container
test("badge has expected container classes", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "view", path: "/src/App.tsx" })} />
  );
  const badge = container.firstChild as HTMLElement;
  expect(badge.className).toContain("inline-flex");
  expect(badge.className).toContain("font-mono");
  expect(badge.className).toContain("rounded-lg");
});
