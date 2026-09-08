# Atelier Code

A small Claude Code–inspired coding assistant for VS Code, built with React, Vite, and shadcn-style components. The current chat flow is intentionally mocked: no API key, backend, or network request is required.

## Run locally

```bash
npm install
npm run build
```

Press `F5` in VS Code and open **Atelier** from the Activity Bar. The webview follows the active VS Code theme.

## Architecture

- `src/extension.ts` — VS Code extension host and webview message bridge
- `src/webview/` — Vite + React interface
- `src/webview/components/ui/` — local shadcn-style primitives
- `src/webview/mock.ts` — deterministic mock assistant behavior

`@shadcn/helpers` and the AI SDK packages are included so the mock layer can later move to the official `createChat()` transport for scripted streaming and approval/tool-call demos. Replace `mockResponse()` with an AI SDK transport when a real model endpoint is ready.
