Post-merge cleanup

This folder contains helper scripts to run after merging the flattened monorepo PR.

Scripts:
- `post-merge-cleanup.sh` - Bash script (dry-run by default). Run with `--apply` to make changes.
- `post-merge-cleanup.ps1` - PowerShell equivalent. Run with `-Apply` to make changes.

What they do (dry-run by default):
- Optionally delete remote branches created during restructuring.
- Untrack large build artifacts and `node_modules` if they were accidentally committed.
- Stage and commit an updated `.gitignore` and cleanup scripts if changes are made.

Usage examples:

Bash:
```bash
# Dry-run
./ops/post-merge-cleanup.sh

# Apply changes
./ops/post-merge-cleanup.sh --apply
```

PowerShell:
```powershell
# Dry-run
.\ops\post-merge-cleanup.ps1

# Apply changes
.\ops\post-merge-cleanup.ps1 -Apply
```
