# ClaimGuard GEMS Internal Edition

## Project overview
Reference lookup tool for GEMS Medical Advisory Services (MAS) employees.
Enables fast PMB regulation lookup, ICD-10 search, DTP algorithm review,
and benefit option scoping. This is a **reference tool only** — not a case
management system, not a member portal, not a complaint handler.

## Audience
GEMS MAS clinical advisors and internal staff. NOT public members.

## Stack
- React 19 · TypeScript (strict mode) · Vite · Tailwind CSS
- Deployed to GitHub Pages via gh-pages branch
- No backend. No database. No external APIs storing user state.

## Deploy commands
```
npm run dev      # local dev server
npm run build    # production build (must pass before any commit)
npm run test     # Vitest unit tests (must pass before any commit)
npm run deploy   # push build to gh-pages branch
```

---

## ABSOLUTE DATA RULES — read before touching any code

1. **ZERO personal member data** — no member names, IDs, scheme numbers,
   diagnosis history, or claim records anywhere in the app.
2. **ZERO personal employee data** — no staff IDs, login sessions, audit
   trails linked to individuals, or role-based access control.
3. **ZERO server-side state** — no backend, no database writes, no external
   APIs that store or transmit user behaviour.
4. **localStorage only** for saved searches — key/value pairs of filter
   states only. No identifiers. Clears on explicit user reset.
5. **All PMB, DTP, and ICD-10 text must be verbatim** from source files
   in `/src/data/`. Never paraphrase, summarise, or infer regulation text.
6. **Never fabricate regulatory content** — if the source file does not
   contain it, Claude must say so and stop, not generate a plausible answer.

---

## Architecture

```
src/
  components/
    filters/        # PMB multi-filter sidebar (6 dimensions)
    results/        # PMB result cards — public regulation data only
    detail/         # DTP algorithm detail panel (full verbatim text)
    search/         # ICD-10 and tariff code search bar
    options/        # GEMS benefit option scope display
  data/
    pmb/            # Public CMS PMB regulation JSON (read-only, versioned)
    icd10/          # ICD-10 public codebook
    dtp/            # Public DTP algorithm markdown files
    gems-options/   # gems-options.json — all 6 benefit options
  lib/
    filters.ts      # Filter logic — pure functions, fully testable
    search.ts       # Search index builder
  hooks/
    useFilters.ts   # Filter state management (no server calls)
    useSavedSearch.ts # localStorage saved searches (no identifiers)
```

---

## GEMS benefit options — all six, correct names

Source: https://www.gems.gov.za/Information/Fact-Sheet

| ID              | Name          | Tier    | Network required | Savings account |
|-----------------|---------------|---------|-----------------|-----------------|
| tanzanite-one   | Tanzanite One | Entry   | YES             | No              |
| beryl           | Beryl         | Entry   | YES             | No              |
| ruby            | Ruby          | Mid     | No              | YES             |
| emerald-value   | Emerald Value | High    | YES             | No              |
| emerald         | Emerald       | High    | No              | No              |
| onyx            | Onyx          | Top     | No              | No              |

Network-dependent options (Tanzanite One, Beryl, Emerald Value) must
display a network-dependency indicator on all PMB result cards.
Ruby is the only option with a savings account mechanism.

Employer subsidy: 75% of total contribution, capped at R4 987/month.

**Never use "Sapphire", "Tanzanite" (without "One"), or any other option
name not in this table.** These do not exist in GEMS.

---

## PMB filter sidebar — 6 filter dimensions

All filter data is derived from publicly available CMS and GEMS sources only.

1. **Benefit category** — Chronic (CDL) | Emergency | Prescribed
2. **Benefit type** — Hospitalisation | Specialist | Radiology | Pathology |
   Mental health | Oncology | Maternity
3. **GEMS benefit option** — all six options above (multi-select)
4. **ICD-10 chapter** — major chapters from public ICD-10 codebook
5. **DTP algorithm** — Algorithm A | Algorithm B | Algorithm C
6. **Funding model** — DSP provider | Non-DSP | PMB-only

Filter logic lives in `src/lib/filters.ts` — pure functions only.
Every filter function must have a corresponding Vitest test.

---

## Feature + test discipline (Ras Mic / Greg Isenberg rule)

**Never build a feature without writing its test at the same time.**
Features are shipped in this order — each must pass tests before the next begins:

1. Multi-filter sidebar (6 dimensions) — test: filter combinations return correct PMB subsets
2. DTP algorithm detail panel — test: clicking a PMB opens verbatim algorithm text
3. ICD-10 / tariff code search — test: search returns correct matches, empty state handled
4. GEMS benefit option scope display — test: network flag shown on correct 3 options
5. Saved searches (localStorage) — test: persists on reload, clears on reset, no identifiers stored
6. Clinical guideline quick-reference links — test: all links resolve, no broken hrefs

---

## Coding rules

- Functional React components only — no class components
- Named exports only — no default exports
- TypeScript strict mode — no `any`, no `@ts-ignore`
- Tailwind utilities only — no inline `style={}` props
- No hardcoded strings for regulatory content — all text from `/src/data/`
- No `console.log` in production builds
- Commit after each completed feature with a descriptive message

---

## GEMS brand colours (Tailwind config)

```
navy:   #0B4E80   ← primary headers, sidebar, buttons
blue:   #1376B7   ← links, active states, filter pills
green:  #19A349   ← success, CDL badge, kept features
green2: #026635   ← Emerald option accent
gold:   #F0A920   ← warnings, mid-tier, gold accent
gold2:  #CD7B28   ← secondary gold
red:    #D51F29   ← errors, removed features, alerts
red2:   #AD2225   ← secondary red
teal:   #00AC9F   ← Tanzanite One accent, teal states
teal2:  #017E81   ← secondary teal
```

---

## Session discipline (shanraisshan / Boris Cherny rules)

- Use **Plan Mode** (Shift+Tab) before starting any new feature
- Use **Ask User Question Tool** to clarify requirements before writing code
- Run `/compact` at 50% context usage — do not wait for quality to degrade
- One session per feature — do not carry multiple features in one context window
- End every session with `/session-review` checklist (see .claude/commands/)
- Commit to git after every completed, tested feature

---

## What Claude must NEVER do in this repo

- Add any personal data fields (member IDs, staff IDs, case numbers, names)
- Add server-side calls or external APIs that store or transmit user state
- Add FIRAC letter generation (personal case data)
- Add CMS complaint submission or case tracking (personal case data)
- Add PDF exports with case references or staff identifiers
- Add login, authentication, or role-based access control
- Paraphrase or summarise PMB, DTP, or ICD-10 regulatory text
- Use GEMS option names other than the six listed above
- Use "Sapphire" — this option does not exist in GEMS

---

## Data sources (all public)

| Data | Source | Location in repo |
|------|--------|-----------------|
| PMB regulation text | CMS Gazette (public) | src/data/pmb/ |
| ICD-10 codebook | WHO public codebook | src/data/icd10/ |
| DTP algorithm text | CMS public DTPs | src/data/dtp/ |
| GEMS benefit options | gems.gov.za/Information/Fact-Sheet | src/data/gems-options/ |
| Clinical guidelines | SAMF, NIMART (public) | src/data/guidelines/ |

Data files are read-only and version-controlled. Update annually at the
start of the benefit year. Always record the source URL and retrieval date
in the JSON metadata field.

---

## Verification checklist (run before every deploy)

```
npm run test          # all Vitest tests must pass
npm run build         # production build must succeed with zero warnings
```

Manual checks:
- [ ] Zero personal data fields anywhere in codebase
- [ ] Zero server calls or external APIs storing user state  
- [ ] All PMB/DTP text is verbatim from /src/data/ source files
- [ ] All six GEMS option names are correct (no "Sapphire")
- [ ] Network dependency flag shown on Tanzanite One, Beryl, Emerald Value
- [ ] Saved search uses localStorage only with no user identifiers
- [ ] Filter logic has corresponding Vitest tests

---

*Last updated: 2026-03-15*
*Source strategy: ClaimGuard GEMS Internal Edition build plan*
*GEMS fact sheet: https://www.gems.gov.za/Information/Fact-Sheet*
