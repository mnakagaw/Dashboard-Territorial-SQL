# PC handoff — 2026-08-15

## Current state

The audited ONE SQLite dashboard is complete. The pending local change updates the dependency manifest and lockfile. Generated SQLite handoff packages, local databases, build directories, and environment files stay outside Git.

## Restore

```bash
git clone https://github.com/mnakagaw/Dashboard-Territorial-SQL.git
cd Dashboard-Territorial-SQL
git switch agent/pc-handoff-2026-08-15
npm ci
npm test
```

