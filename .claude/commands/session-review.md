# /session-review

End-of-session checklist. Run this before every commit and every deploy.
If any check fails, fix it before committing.

## Checklist

Claude must check each item and report PASS or FAIL with specific file
references for any failures.

### Data safety
- [ ] No personal member data in any component or data file
      (names, member IDs, scheme numbers, diagnosis history, claim records)
- [ ] No personal employee data
      (staff IDs, login sessions, role-based state)
- [ ] No server calls or external APIs that store or transmit user state
- [ ] localStorage is used only for filter state — no identifiers

### Regulatory accuracy  
- [ ] All PMB text matches verbatim content in /src/data/pmb/
- [ ] All DTP algorithm text matches verbatim content in /src/data/dtp/
- [ ] GEMS benefit option names are exactly:
      Tanzanite One · Beryl · Ruby · Emerald Value · Emerald · Onyx
      (no "Sapphire", no "Tanzanite" without "One")
- [ ] Network-dependency flag shown on: Tanzanite One, Beryl, Emerald Value
- [ ] Ruby is the only option with savings_account: true

### Code quality
- [ ] npm run test — all Vitest tests pass
- [ ] npm run build — zero errors, zero warnings
- [ ] No console.log statements in production code
- [ ] No inline style={} props (Tailwind only)
- [ ] No default exports (named exports only)

### No consumer features
- [ ] No FIRAC letter generation
- [ ] No CMS complaint submission
- [ ] No member portal links
- [ ] No PDF exports with personal fields
- [ ] No login or authentication UI

## After review

If all checks pass:
```
git add .
git commit -m "your descriptive message here"
git push origin main
```

If any checks fail, fix them first. Do not push failing code.
