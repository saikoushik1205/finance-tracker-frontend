# Auto-merge helper: polls PR #1 checks and merges when green
$max = 30
for ($i = 1; $i -le $max; $i++) {
  Write-Host "Poll $i/$max"
  $json = & 'C:\Program Files\GitHub CLI\gh.exe' pr view 1 --json statusCheckRollup 2>$null
  if (-not $json) { Write-Host 'gh returned no data; retrying'; Start-Sleep -Seconds 10; continue }
  $j = $json | ConvertFrom-Json

  $failed = $j.statusCheckRollup | Where-Object { ($_.state -eq 'FAILURE') -or ($_.conclusion -eq 'FAILURE') }
  if ($failed) {
    Write-Host 'One or more checks failed:'
    $failed | Format-Table context,state,conclusion -AutoSize
    exit 2
  }

  $pending = $j.statusCheckRollup | Where-Object { ($_.state -eq 'PENDING') -or ($_.conclusion -eq $null) }
  if (-not $pending -and $j.statusCheckRollup.Count -gt 0) {
    Write-Host 'All checks complete and no failures — proceeding to merge.'
    & 'C:\Program Files\GitHub CLI\gh.exe' pr merge 1 --merge --delete-branch --body 'Merging flattened monorepo after checks passed.'
    if ($LASTEXITCODE -ne 0) { Write-Host "Merge failed with exit code $LASTEXITCODE"; exit 3 }
    Write-Host 'Merge succeeded. Running cleanup script (apply).'
    .\ops\post-merge-cleanup.ps1 -Apply
    exit 0
  }

  Write-Host 'Checks pending — sleeping 10s'
  Start-Sleep -Seconds 10
}

Write-Host "Timeout waiting for checks to pass after $max attempts (~$([math]::Round($max*10/60,2)) minutes)."
exit 1
