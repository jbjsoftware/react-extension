# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Atelier Code — a VS Code extension that provides a Claude Code–inspired chat sidebar, built with React + Vite + shadcn-style components. The chat flow is currently **entirely mocked**: no API key, backend, or network request is involved. Responses come from keyword matching in `src/webview/mock.ts`.

## Commands

```bash
npm install
npm run build          # builds webview (vite) + extension host (esbuild) into dist/
npm run watch           # rebuilds both on change (concurrently)
npm run check            # tsc --noEmit type check, no test suite exists
npm run package           # vsce package -> produces .vsix
```

There is no test runner configured (`npm run check` is the only verification step). To try the extension, run `npm run build`, then press `F5` in VS Code to launch an Extension Development Host, and open **Atelier** from the Activity Bar.

## Architecture

Two separate build targets share one `src/` tree but compile independently and never import from each other:

- **Extension host** — `src/extension.ts`. Compiled by esbuild directly (CJS, `dist/extension.cjs`), `vscode` externalized. Registers the `atelier.chatView` webview view and two commands (`atelier.newChat`, `atelier.openChat`). `ChatViewProvider.html()` builds the webview's HTML shell inline with a nonce-based CSP, pointing at the Vite-built `dist/webview/assets/app.js` and `index.css`.
- **Webview UI** — `src/webview/`. Compiled by Vite (`vite.config.ts` forces a fixed output filename `assets/app.js` / `assets/[name][extname]` so the extension host's hardcoded asset paths keep working — don't add hashed filenames). `App.tsx` is the whole chat UI; `mock.ts` supplies fake assistant responses keyed on substrings in the user's prompt (`"test"`, `"bug"/"fix"`, else a default architecture-explainer response).

**Message bridge**: the webview talks to the extension host via `acquireVsCodeApi().postMessage` (see the `insertText` / `openFile` handlers in `extension.ts`) and receives messages back via `window.addEventListener("message", ...)` (see the `newChat` listener in `App.tsx`). This bridge is the seam to preserve when adding new host-side capabilities (filesystem, editor, terminal access) — the webview itself is sandboxed and has no direct Node/VS Code API access.

**Path to a real backend**: per `README.md`, `@ai-sdk/react`/`ai` packages are already dependencies specifically so `mockResponse()` in `mock.ts` can later be replaced with the AI SDK's `createChat()` transport for real streaming/tool-call/approval flows — that's the intended extension point, not a rewrite of `App.tsx`.

`src/webview/components/ui/` holds local shadcn-style primitives (`button.tsx`, `tooltip.tsx`) — extend these in place rather than pulling in a component library wholesale.

## Notes

- `atelier-code-0.1.0.vsix` and `dist/` are build output — don't hand-edit them.
- `dist/webview/assets/index.css` and `app.js` filenames are load-bearing (hardcoded in `extension.ts`'s `html()`); if you change `vite.config.ts` output naming, update `extension.ts` too.
