# /new-feature

Start building a new feature for ClaimGuard GEMS Internal Edition.

## What this command does

Runs the full Plan → Build → Test → Commit workflow for a single feature.
Always activates Plan Mode first. Never writes code before the plan is agreed.

## Usage

```
/new-feature "Description of the feature"
```

## Workflow

1. **Enter Plan Mode** (do not write any code yet)
   - Read CLAUDE.md to confirm the data rules
   - Read the relevant files in src/components/ and src/data/ for context
   - Use the Ask User Question Tool to clarify any ambiguities about:
     - What data sources does this feature use?
     - What does the empty/zero-results state look like?
     - What is the test assertion for this feature?
     - Are there any GEMS option or PMB accuracy constraints?

2. **Produce a written plan** — list the files to create/edit and the test
   to write. Get confirmation before proceeding.

3. **Switch to Normal Mode** — implement the feature

4. **Write the Vitest test** — in the same session, immediately after building

5. **Run tests and build**
   ```
   npm run test
   npm run build
   ```
   Both must pass with zero errors before finishing.

6. **Run /session-review** — confirm no personal data, no consumer UI

7. **Commit with a descriptive message**
   ```
   git add .
   git commit -m "feat: [feature description]"
   ```

## Rules (from CLAUDE.md)

- ZERO personal data — no member IDs, staff IDs, case numbers
- All PMB/DTP text verbatim from /src/data/ only
- Named exports only, no default exports
- Tailwind utilities only, no inline styles
- TypeScript strict if migrating — otherwise plain JS is fine
