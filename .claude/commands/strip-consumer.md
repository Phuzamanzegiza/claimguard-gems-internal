# /strip-consumer

Safely remove all consumer-facing and personal-data components
from the cloned pmb-checker source before building the GEMS internal version.

## What this command does

Scans the codebase for components and features that must not exist in the
GEMS Internal Edition. Lists them, asks for confirmation, then removes them.
Creates a git checkpoint before deleting anything.

## Run order

This command should be the **first** thing run after cloning the source repo.
Run it **before** any new feature is added.

## Workflow

1. **Scan** — find all instances of:
   - FIRAC letter generation or templates
   - CMS complaint submission forms or flows
   - Member portal links or redirects
   - Case number input fields or displays
   - Staff ID or employee ID fields
   - Audit trail components that log user identities
   - PDF export with case references or personal fields
   - "Submit a complaint" or "Dispute this decision" UI
   - Any login, authentication, or session management
   - localStorage keys that store anything other than filter state

2. **List** — print a clear list of every file and component found.
   Do NOT delete yet. Ask: "Proceed with removal? (yes/no)"

3. **Checkpoint** — before deleting, run:
   ```
   git add .
   git commit -m "checkpoint: before consumer feature removal"
   ```

4. **Remove** — delete or gut each identified component.
   For files: delete entirely.
   For mixed files (some consumer, some useful): remove only the
   consumer sections and keep the rest.

5. **Verify** — run:
   ```
   npm run build
   ```
   Build must succeed after removal.

6. **Commit**
   ```
   git add .
   git commit -m "remove: all consumer-facing and personal-data features"
   ```

## What to keep

- PMB lookup engine and search logic
- ICD-10 and tariff code search
- DTP algorithm display
- CMS regulatory text display
- Any utility functions (filtering, sorting, formatting) that contain
  no personal data
- The GitHub Actions deploy workflow (update base path if needed)
