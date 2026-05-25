#!/usr/bin/env bash
set -euo pipefail

# Post-merge cleanup script
# Usage: ./post-merge-cleanup.sh [--apply]
# Default run is dry-run. Pass --apply to perform changes.

DRY_RUN=true
if [ "${1-}" = "--apply" ]; then
  DRY_RUN=false
fi

echo "Post-merge cleanup (dry-run=${DRY_RUN})"

# Remote branches to remove
BRANCHES=("flatten/merge-nested" "merge/flatten-into-main" "restructure/frontend-backend" "restructure/frontend-nested")

for b in "${BRANCHES[@]}"; do
  if $DRY_RUN; then
    echo "Would delete remote branch: origin/${b}"
  else
    echo "Deleting remote branch origin/${b}"
    git push origin --delete "${b}" || echo "Failed to delete origin/${b} or branch does not exist"
  fi
done

# Paths to untrack if present
PATHS=(
  "Fintrack-Frontend/node_modules"
  "Fintrack-Frontend/dist"
  "Fintrack-Frontend/.angular"
  "Fintrack-Backend/node_modules"
  "Fintrack-Backend/dist"
  "node_modules"
  "dist"
  ".angular"
)

for p in "${PATHS[@]}"; do
  if [ -e "${p}" ]; then
    if $DRY_RUN; then
      echo "Would run: git rm -r --cached ${p}"
    else
      echo "Removing from git index: ${p}"
      git rm -r --cached "${p}" || echo "Path ${p} not tracked or failed"
    fi
  fi
done

if $DRY_RUN; then
  echo "Dry-run complete. Re-run with --apply to make changes."
  exit 0
fi

# Stage and commit .gitignore and ops scripts updates
git add .gitignore ops/post-merge-cleanup.* ops/README_CLEANUP.md || true
if git diff --staged --quiet; then
  echo "No staged changes to commit."
else
  git commit -m "chore: post-merge cleanup (untrack build artifacts, update .gitignore)"
  git push
fi

echo "Cleanup complete."
