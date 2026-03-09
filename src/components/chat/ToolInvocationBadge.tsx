import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

function extractFilename(args: Record<string, unknown>): string {
  const raw = typeof args.path === "string" ? args.path : "";
  return raw.split("/").filter(Boolean).at(-1) ?? "";
}

function getToolLabel(toolName: string, args: Record<string, unknown>): string {
  const filename = extractFilename(args);

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "view":       return `Reading ${filename}`;
      case "create":     return `Creating ${filename}`;
      case "str_replace":
      case "insert":     return `Editing ${filename}`;
      case "undo_edit":  return "Undoing edit";
      default:           return "Working...";
    }
  }

  if (toolName === "file_manager") {
    switch (args.command) {
      case "rename": return `Renaming ${filename}`;
      case "delete": return `Deleting ${filename}`;
      default:       return "Working...";
    }
  }

  return "Working...";
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const label = getToolLabel(toolInvocation.toolName, toolInvocation.args);
  const isDone = toolInvocation.state === "result" && toolInvocation.result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
