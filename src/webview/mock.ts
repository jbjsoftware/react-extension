export type ToolStep = { icon: "search" | "edit" | "terminal"; title: string; detail: string }
export type ChatMessage = { id: string; role: "user" | "assistant"; text: string; steps?: ToolStep[]; code?: string }

export const starters = ["Explain this codebase", "Find and fix a bug", "Add tests for the current file"]

export function mockResponse(prompt: string): Omit<ChatMessage, "id"> {
  const lower = prompt.toLowerCase()
  if (lower.includes("test")) return {
    role: "assistant",
    text: "I reviewed the likely test surface. I’d start with the behavior users depend on, then cover the edge cases around empty state and failures.",
    steps: [
      { icon: "search", title: "Searched workspace", detail: "Found testable React components" },
      { icon: "edit", title: "Proposed test", detail: "src/components/App.test.tsx" }
    ],
    code: `it("submits a prompt", async () => {\n  render(<App />)\n  await userEvent.type(screen.getByRole("textbox"), "Hello")\n  await userEvent.keyboard("{Enter}")\n  expect(screen.getByText("Hello")).toBeVisible()\n})`
  }
  if (lower.includes("bug") || lower.includes("fix")) return {
    role: "assistant",
    text: "I found a likely stale-state issue in the submit path. The handler reads the previous value after clearing the input. Capturing the prompt first keeps the operation deterministic.",
    steps: [
      { icon: "search", title: "Read 6 files", detail: "Focused on event handlers and state" },
      { icon: "terminal", title: "Checked diagnostics", detail: "No TypeScript errors" },
      { icon: "edit", title: "Prepared fix", detail: "Capture value before state update" }
    ],
    code: `const handleSubmit = () => {\n  const prompt = input.trim()\n  if (!prompt) return\n  setInput("")\n  sendMessage(prompt)\n}`
  }
  return {
    role: "assistant",
    text: "This looks like a compact React + Vite workspace with a VS Code extension host and a webview UI. The clean boundary is the message bridge: React owns presentation and local interaction; the extension host owns editor and filesystem capabilities.",
    steps: [
      { icon: "search", title: "Explored project", detail: "Read package metadata and source tree" },
      { icon: "search", title: "Mapped architecture", detail: "Extension host → webview bridge → React UI" }
    ]
  }
}
