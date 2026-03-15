# PLAN.md — Day 1 Claude Code Prompts

Paste these prompts into Claude Code **in order**.
Start a new session for each numbered section.

---

## Session 0 — Orientation (run once, immediately after `claude` starts)

```
Read CLAUDE.md completely. Then read the src/ directory structure.
Tell me:
1. What consumer-facing or personal-data features exist in the current codebase?
2. What can be kept for the GEMS internal version?
3. What is the current deploy configuration and does the base path need updating?
Do not change any files yet.
```

---

## Session 1 — Strip consumer features

```
/strip-consumer
```

After it lists findings, type `yes` to confirm removal.
Then verify: `npm run build` must pass.

---

## Session 2 — Fix base path and update project name

```
Update vite.config.js base path to '/claimguard-gems-internal/'.
Update package.json name to "claimguard-gems-internal".
Update any hardcoded URLs or repo references in the codebase.
Run npm run build to confirm it still passes.
Commit: "config: update base path and project name for GEMS internal repo"
```

---

## Session 3 — Feature 1: Multi-filter PMB sidebar

Start with Plan Mode (Shift+Tab), then paste:

```
I want to build a multi-filter sidebar for the PMB lookup results.
Before writing any code, use the Ask User Question Tool to ask me
about these decisions:
- How many filters can be active at the same time?
- What happens when the filter combination returns zero results?
- Should active filters be shareable via URL query params?
- Should the sidebar be collapsible on mobile?
- Where does the filter data come from — the existing PMB data structure
  or a new file?

Do not write any code until I have answered all questions.
```

After answering, switch to Normal Mode and build Feature 1.
Test to write:
```
"Selecting Chronic (CDL) AND Algorithm C returns only PMBs matching
both conditions. Selecting a GEMS option filters to that option's PMBs."
```

---

## Session 4 — Feature 2: Correct GEMS benefit options

```
Replace all references to incorrect GEMS option names in the codebase.
The correct six options are in src/data/gems-options/gems-options.json.
Network-dependent options (Tanzanite One, Beryl, Emerald Value) must
display a network indicator on PMB result cards.
Ruby must display a savings account indicator.
Write a test: all six option names render correctly, network flag
appears on exactly three options.
Run npm run test and npm run build.
Commit: "feat: correct GEMS benefit options, add network dependency flags"
```

---

## Session 5 — Feature 3: DTP algorithm detail panel

```
Add a detail panel that opens when a PMB result is clicked.
It should show the full DTP algorithm text for that PMB, loaded
verbatim from src/data/dtp/.
Do not paraphrase or summarise — show the complete published text.
Write a test: clicking PMB-0037 opens the Algorithm C detail panel
with non-empty content sourced from the data file.
Run npm run test and npm run build.
Commit: "feat: DTP algorithm detail panel with verbatim public text"
```

---

## Session 6 — Feature 4: Saved searches (localStorage only)

```
Add a saved searches feature using localStorage only.
Rules:
- Store only the filter state object (no user identifiers)
- Maximum 10 saved searches
- Each saved search has a user-supplied name and the filter state
- Clear all saves with a single reset button
Write two tests:
1. A saved filter state persists after page reload
2. Reset clears all saved searches and localStorage is empty
Run npm run test and npm run build.
Commit: "feat: saved searches via localStorage, no identifiers"
```

---

## Session 7 — Final review and deploy

```
/session-review
```

If all checks pass:
```
git add .
git commit -m "release: ClaimGuard GEMS Internal Edition v1.0"
git push origin main
```

GitHub Actions will automatically build, test, and deploy to GitHub Pages.
Check the Actions tab in GitHub to confirm the deploy succeeds.

---

## Useful mid-session commands

```
/compact          # when context reaches 50% — always do this proactively
/session-review   # before any commit
ultrathink        # add to a prompt when deep reasoning is needed
                  # e.g. "ultrathink: what is the best way to structure
                  #       the filter state so saved searches work correctly?"
```

---

## If something breaks

```
# Rewind to last checkpoint
git log --oneline -10     # find the commit to revert to
git revert HEAD           # undo last commit safely
# or
git reset --hard HEAD~1   # hard reset (loses uncommitted work)
```

Claude Code also has built-in rewind: press `Esc Esc` or type `/rewind`

---

*Source repo: https://github.com/Phuzamanzegiza/pmb-checker*
*Target repo: claimguard-gems-internal*
*Strategy: ClaimGuard GEMS Internal Edition build plan, March 2026*
