<#
Post-merge cleanup PowerShell script
Usage: .\post-merge-cleanup.ps1 [-Apply]
Default: dry-run. Use -Apply to perform changes.
#>
param(
  [switch]$Apply
)

$dryRun = -not $Apply
Write-Host "Post-merge cleanup (dryRun=$dryRun)"

$branches = @('flatten/merge-nested','merge/flatten-into-main','restructure/frontend-backend','restructure/frontend-nested')
foreach ($b in $branches) {
  if ($dryRun) { Write-Host "Would delete remote branch: origin/$b" }
  else { Write-Host "Deleting origin/$b"; git push origin --delete $b }
}

$paths = @(
  'Fintrack-Frontend\node_modules',
  'Fintrack-Frontend\dist',
  'Fintrack-Frontend\.angular',
  'Fintrack-Backend\node_modules',
  'Fintrack-Backend\dist',
  'node_modules',
  'dist',
  '.angular'
)

foreach ($p in $paths) {
  if (Test-Path $p) {
    if ($dryRun) { Write-Host "Would run: git rm -r --cached $p" }
    else { Write-Host "Removing from git index: $p"; git rm -r --cached -- "$p" }
  }
}

if ($dryRun) { Write-Host "Dry-run complete. Re-run with -Apply to make changes."; exit 0 }

git add .gitignore ops/post-merge-cleanup.* ops/README_CLEANUP.md 2>$null | Out-Null
$staged = git diff --staged --name-only
if (-not $staged) { Write-Host "No staged changes to commit." }
else { git commit -m "chore: post-merge cleanup (untrack build artifacts, update .gitignore)"; git push }

Write-Host "Cleanup complete."