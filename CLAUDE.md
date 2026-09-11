# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Atelier Code — a VS Code extension that provides a Claude Code–inspired chat sidebar, built with React + Vite + Tailwind v4 + shadcn (`base-nova` style, Base UI primitives). It's a discovery project proving out that stack inside a VS Code webview. The chat flow is currently **entirely mocked**: no API key, backend, or network request is involved. Responses come from keyword matching in `src/webview/mock.ts`.

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

## shadcn / Tailwind / Base UI

This is real shadcn, not hand-rolled lookalikes: `components.json` (style `base-nova`, base library `base` — Base UI, not Radix) drives the CLI. Use `npx shadcn@latest add <component>` to add primitives; don't hand-write them.

- **Import alias**: `@/*` → `src/webview/*` (not the repo-root `src/`, since `src/` also holds the Node-side `extension.ts`). Configured in both `tsconfig.json` (`compilerOptions.paths`) and `vite.config.ts` (`resolve.alias`) — keep them in sync, and don't run `shadcn init` again pointed at repo-root `src/`.
- **Base UI, not Radix**: components use the `render={<Button/>}` composition prop, not Radix's `asChild`. See `.claude/skills/shadcn/rules/base-vs-radix.md` for the full API differences (Select, ToggleGroup, Slider, Accordion) before adding those components.
- **Theming seam**: `src/webview/styles.css` intentionally has *two* layers of the same CSS custom properties inside one `:root` rule — shadcn's static `base-nova` oklch palette first (defaults), then a second block of the same variable names re-declared with `var(--vscode-*, <fallback>)` wrappers, which wins because it comes later in the cascade. That second block is what makes the webview follow the active VS Code theme; when re-running `shadcn init`/`apply` or adding components that introduce new tokens (e.g. `--destructive`, `--chart-*`, `--sidebar-*`), re-check whether they need a VS Code-mapped override added too, or the CLI's static light-theme value will silently win again.
- `--primary`/`--primary-foreground`/`--ring` are pinned to the brand orange (`#d97757`), not VS Code-mapped — that's deliberate, matching the Claude Code accent color rather than the editor theme.
- Fonts (`@fontsource-variable/geist`) and `shadcn/tailwind.css` are `@import`ed into `styles.css`; the Vite build inlines the woff2s as flat files under `dist/webview/assets/`, which the webview's CSP (`font-src ${webview.cspSource}`) allows since they're same-origin relative URLs — don't switch to a Google Fonts `<link>` or similar, it'll be blocked by CSP.

## Notes

- `atelier-code-0.1.0.vsix` and `dist/` are build output — don't hand-edit them.
- `dist/webview/assets/index.css` and `app.js` filenames are load-bearing (hardcoded in `extension.ts`'s `html()`); if you change `vite.config.ts` output naming, update `extension.ts` too.
