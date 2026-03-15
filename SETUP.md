# ClaimGuard GEMS Internal — MacBook Setup Guide

Follow these steps **in order**. Each step has exactly what to type.

---

## Prerequisites (do once, skip if already done)

Open **Terminal** (or iTerm2 / Ghostty) and check:

```bash
node --version      # need v18 or higher
git --version       # need any recent version
gh --version        # GitHub CLI — install if missing
```

Install GitHub CLI if missing:
```bash
brew install gh
gh auth login       # follow prompts, choose GitHub.com → HTTPS → browser
```

Install Claude Code if not yet installed:
```bash
npm install -g @anthropic-ai/claude-code
```

---

## Step 1 — Clone the source repo

```bash
cd ~/projects        # or wherever you keep your work
mkdir -p ~/projects  # create if it doesn't exist

git clone https://github.com/Phuzamanzegiza/pmb-checker claimguard-gems-internal
cd claimguard-gems-internal
```

---

## Step 2 — Drop in the starter kit files

Copy every file from this starter kit into the root of `claimguard-gems-internal`.
These files will overwrite the originals where names match:

| File | What it does |
|------|-------------|
| `CLAUDE.md` | Tells Claude Code the rules for this project |
| `package.json` | Updated project name and adds Vitest |
| `vite.config.js` | Updated base path for new GitHub Pages URL |
| `.github/workflows/deploy.yml` | Auto-deploy to GitHub Pages on push to main |
| `src/data/gems-options/gems-options.json` | All 6 correct GEMS options (official) |
| `.claude/commands/new-feature.md` | `/new-feature` slash command |
| `.claude/commands/strip-consumer.md` | `/strip-consumer` slash command |
| `.claude/commands/session-review.md` | `/session-review` slash command |
| `PLAN.md` | Day 1 Claude Code prompts — paste these in order |

```bash
# From inside claimguard-gems-internal/
cp path/to/starter-kit/* .             # copy all root-level files
cp path/to/starter-kit/.claude/commands/* .claude/commands/
cp path/to/starter-kit/.github/workflows/deploy.yml .github/workflows/
cp path/to/starter-kit/src/data/gems-options/gems-options.json src/data/gems-options/
```

---

## Step 3 — Create a new GitHub repo

```bash
# Still inside claimguard-gems-internal/
gh repo create claimguard-gems-internal --public --source=. --remote=origin --push
```

This creates the repo on GitHub under your account and pushes the first commit.

---

## Step 4 — Enable GitHub Pages

```bash
gh api repos/{owner}/claimguard-gems-internal/pages \
  --method POST \
  --field source='{"branch":"gh-pages","path":"/"}' 2>/dev/null || true
```

Or do it manually: GitHub repo → Settings → Pages → Source: `gh-pages` branch → Save.

---

## Step 5 — Install dependencies

```bash
npm install
npm run build   # confirm it builds before starting Claude Code
```

---

## Step 6 — Launch Claude Code and start Day 1

```bash
claude
```

Then follow **PLAN.md** — paste the prompts in order.

---

## Useful commands during development

```bash
npm run dev          # local dev server → http://localhost:5173
npm run test         # run Vitest tests
npm run build        # production build
npm run deploy       # manual deploy to gh-pages (CI does this automatically)
/compact             # run inside Claude Code when context reaches 50%
/session-review      # run inside Claude Code before committing
```

---

## Your live URL after deploy

```
https://[your-github-username].github.io/claimguard-gems-internal/
```

---

*Source repo: https://github.com/Phuzamanzegiza/pmb-checker*
*GEMS Fact Sheet: https://www.gems.gov.za/Information/Fact-Sheet*
