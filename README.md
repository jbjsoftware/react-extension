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


 ### 1. Triage (head session)

You are the coordinator for parallel work on this repository's GitHub issues. In this step you only plan. Do not write code, create branches, or create worktrees.

1. Run `gh issue list --state open --limit 100` (filter: {LABEL OR "none"}). Read each candidate with `gh issue view <n> --comments`.
2. For each issue, search the codebase and note:
   - a one-line summary of the fix
   - the files or modules it will most likely touch
   - size: S (under ~50 lines), M, or L
   - whether it is clear enough to do without asking a human. If not, write the question you would ask.
   - any dependency on another issue in the list
3. Group the issues into waves:
   - Issues in the same wave must not touch the same files and must not depend on each other.
   - Put overlapping or dependent issues in later waves, in dependency order.
   - Leave unclear or L-sized issues out of the waves. List them under "Needs human".
   - At most {MAX_PARALLEL, e.g. 4} issues per wave.
4. Write the plan to `.agents/issue-plan.md` (add `.agents/` to .git/info/exclude so it is never committed). Include: a table of all issues with the notes above, the waves, the Needs-human list, and any file-overlap risks you see.
5. Stop, show me the waves, and wait for my approval or edits.

### 2. Dispatch a wave (head session)

Execute Wave {N} from `.agents/issue-plan.md` as I approved it.

Before starting:
- Run `herdr --help` (and the herdr skill, if loaded) to confirm the exact commands for creating tabs, running a command in a pane, and waiting on an agent. Use the real syntax, not guesses.
- `git fetch origin` and confirm `{BASE_BRANCH, e.g. main}` is up to date.

For each issue in the wave:
1. Create a worktree at `../{REPO}-worktrees/issue-<n>` on a new branch `fix/issue-<n>-<short-slug>` from `origin/{BASE_BRANCH}`. Create worktrees one at a time, not concurrently, to avoid git lock errors.
2. Open a herdr tab named `issue-<n>` with its working directory set to that worktree, and start Claude Code there.
3. Send it the worker prompt below, with the placeholders filled in. Include the issue's planning notes from the plan file.
4. Assign each worker a unique dev port: {BASE_PORT} + index.

Then monitor:
- Wait on each worker until it is done, idle, or blocked.
- If a worker is blocked on a question it cannot answer from the code, relay the question to me verbatim. Do not answer product questions yourself.
- If a worker is blocked on a permission prompt, tell me which tab.
- When every worker has finished, update `.agents/issue-plan.md` with each issue's status, PR link, and any notes. Then give me a short summary table: issue, PR, CI status, anything I should look at first.

Rules: never merge PRs, never push to {BASE_BRANCH}, and never edit files inside a worker's worktree yourself.

### 3. Worker template (the head fills this in for each issue)
You are fixing GitHub issue #{N} in this worktree only: {WORKTREE_PATH} (branch {BRANCH}). Other agents are working in sibling worktrees. Never read or modify files outside this directory.

Context from planning: {PLANNING_NOTES}
Use port {PORT} for any dev server or test server you start.

Steps:
1. Run `gh issue view {N} --comments` and read the full issue.
2. Install dependencies for this worktree ({INSTALL_COMMAND, e.g. npm ci}).
3. Reproduce the problem. Where practical, write a failing test first.
4. Make the smallest fix that resolves the issue. Stay in scope: no drive-by refactors, formatting changes in untouched code, or dependency upgrades. If you notice other problems, list them in your report instead of fixing them.
5. Run {TEST_COMMAND} and {LINT_COMMAND}. Everything must pass. If an unrelated test was already failing on the base branch, say so instead of fixing it.
6. Commit with a clear message ending in `Fixes #{N}`. Push the branch.
7. Open a PR against {BASE_BRANCH} with `gh pr create`. Title: a short description of the fix. Body: what was wrong, what you changed, how you tested it, and `Fixes #{N}`. {DRAFT: add --draft if you want PRs opened as drafts}
8. Finish with this report and nothing else:
   STATUS: done | blocked | gave-up
   PR: <url or none>
   SUMMARY: <2-3 sentences>
   FILES CHANGED: <list>
   RISKS / FOLLOW-UPS: <anything a reviewer should know>

If the issue is ambiguous, or the right fix would require a design decision or changes far outside the expected files, stop before writing code. Report STATUS: blocked with your specific question.

### 4. Wrap up a wave (head session, after you've reviewed and merged)

Wave {N} review is done. Tidy up and prepare the next wave.

1. `git fetch origin`. For each issue in Wave {N}, check its PR state with `gh pr view`.
2. For merged PRs: remove the worktree (`git worktree remove`), delete the local branch, close the herdr tab, and mark the issue done in `.agents/issue-plan.md`.
3. For open PRs: report CI status and unresolved review comments. Do not remove those worktrees.
4. Re-check the next wave against what just merged. If merged changes touched files that next-wave issues will need, note it, and adjust the plan if an issue is now already fixed or has changed scope.
5. Show me the updated plan and wait for approval before dispatching the next wave.

---

To run it: paste prompt 1, edit the waves it proposes, paste prompt 2 with the wave number, review the PRs, then run prompt 4. Repeat 2 → 4 for each wave. To address review comments on an open PR, go to that worker's tab and tell it directly. It still has the context.

If you use the herd coordinator, start the head with /herd and then paste prompts 1, 2 and 4 the same way. Herd handles the tab spawning and waiting, so you can drop the herdr-command checks from prompt 2.****
