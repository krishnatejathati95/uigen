import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "../main-content";

vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <>{children}</>,
  useFileSystem: vi.fn(() => ({
    fileSystem: { serialize: () => ({}) },
    selectedFile: null,
    setSelectedFile: vi.fn(),
    createFile: vi.fn(),
    updateFile: vi.fn(),
    deleteFile: vi.fn(),
    renameFile: vi.fn(),
    getFileContent: vi.fn(),
    getAllFiles: vi.fn(() => new Map()),
    refreshTrigger: 0,
    handleToolCall: vi.fn(),
    reset: vi.fn(),
  })),
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <>{children}</>,
  useChat: vi.fn(() => ({
    messages: [],
    input: "",
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    status: "idle",
  })),
}));

vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface" />,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame" />,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree" />,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor" />,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions" />,
}));

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  ResizablePanel: ({ children }: any) => <div>{children}</div>,
  ResizableHandle: () => <div />,
}));

function getPreviewWrapper() {
  return screen.getByTestId("preview-frame").parentElement!;
}

function getCodeViewWrapper() {
  // The code view (ResizablePanelGroup) is rendered as the next sibling of the preview wrapper
  return getPreviewWrapper().nextElementSibling as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

test("shows preview by default and hides code view", () => {
  render(<MainContent />);

  expect(getPreviewWrapper().className).not.toContain("hidden");
  expect(getCodeViewWrapper().className).toContain("hidden");
});

test("switches to code view when Code tab is clicked", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  await user.click(screen.getByRole("tab", { name: "Code" }));

  expect(getPreviewWrapper().className).toContain("hidden");
  expect(getCodeViewWrapper().className).not.toContain("hidden");
});

test("switches back to preview when Preview tab is clicked after Code", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  await user.click(screen.getByRole("tab", { name: "Code" }));
  await user.click(screen.getByRole("tab", { name: "Preview" }));

  expect(getPreviewWrapper().className).not.toContain("hidden");
  expect(getCodeViewWrapper().className).toContain("hidden");
});

test("both preview and code remain mounted when toggling", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // Both should be in DOM initially
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.getByTestId("code-editor")).toBeDefined();

  await user.click(screen.getByRole("tab", { name: "Code" }));

  // Both still in DOM after switching to Code
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.getByTestId("code-editor")).toBeDefined();

  await user.click(screen.getByRole("tab", { name: "Preview" }));

  // Both still in DOM after switching back to Preview
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.getByTestId("code-editor")).toBeDefined();
});
