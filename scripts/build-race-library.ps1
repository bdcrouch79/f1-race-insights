<#
.SYNOPSIS
    RaceIQ Phase 1 Race Library Engine: generate the curated race library
    locally, validate it, and run the repository's full verification suite.

.DESCRIPTION
    This is the Windows entry point for RaceIQ Phase 1. It does not
    replace or duplicate the existing Python analysis engine
    (analysis/raceiq/) or its JSON contract -- it only automates the
    steps already documented in AGENTS.md/README.md:

      1. Create or reuse a local Python virtual environment (.venv).
      2. Install dependencies from the repository's existing
         analysis/requirements.txt.
      3. Create (or reuse) the local FastF1 session cache (cache/).
      4. Generate every race in data/race-manifest.json via
         scripts/generate_batch.py -> scripts/generate_analysis.py ->
         analysis/raceiq/engine.py, skipping races that already have a
         schema-valid committed analysis unless -Force is supplied.
      5. Validate every committed analysis JSON file against the
         contract (scripts/validate_generated.py).
      6. Run the Python test suite (pytest, no network required).
      7. Run the frontend test suite, typecheck, lint, and production
         build (apps/web).
      8. Print one final report covering every stage above.

    Requires real network access to FastF1's data sources
    (livetiming.formula1.com, api.jolpi.ca) for step 4 -- this is a
    controlled, out-of-band generation step, not a live request handler.
    See docs/ARCHITECTURE.md. Steps 1-3 and 5-7 do not require network
    access beyond installing dependencies the first time.

    Never commits anything itself. cache/ and .venv/ are both
    git-ignored and this script does not run `git add`/`git commit` --
    review `git status` and commit data/generated yourself once you've
    read the summary.

.PARAMETER Force
    Regenerate every manifest race even if a schema-valid analysis is
    already committed for it.

.PARAMETER Year
    Generate only one race: the manifest entry for this season. Must be
    supplied together with -Event.

.PARAMETER Event
    Generate only one race: the manifest entry whose event query or
    display name matches this text (case-insensitive). Must be supplied
    together with -Year.

.EXAMPLE
    .\scripts\build-race-library.ps1
    Generate every race in the manifest that isn't already committed,
    then validate and run the full check suite.

.EXAMPLE
    .\scripts\build-race-library.ps1 -Year 2024 -Event Monaco
    Regenerate/verify just the 2024 Monaco Grand Prix, then run the
    full check suite.

.EXAMPLE
    .\scripts\build-race-library.ps1 -Force
    Regenerate every manifest race from scratch, even ones already
    committed.
#>

[CmdletBinding()]
param(
    [switch]$Force,
    [int]$Year,
    [string]$Event
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$YearSupplied = $PSBoundParameters.ContainsKey('Year')
$EventSupplied = -not [string]::IsNullOrWhiteSpace($Event)

if ($YearSupplied -xor $EventSupplied) {
    Write-Error "-Year and -Event must be supplied together (to generate one race) or both omitted (to generate the full manifest)."
    exit 2
}

$RepoRoot = Split-Path -Parent $PSScriptRoot
$VenvDir = Join-Path $RepoRoot ".venv"
$VenvPython = Join-Path $VenvDir "Scripts\python.exe"
$CacheDir = Join-Path $RepoRoot "cache"
$AnalysisRequirements = Join-Path $RepoRoot "analysis\requirements.txt"
$WebDir = Join-Path $RepoRoot "apps\web"

# One row per stage: Name, Status (PASS/FAIL/SKIP), Detail. Printed as
# the final report regardless of what happened above, so a failure
# partway through still leaves Bryan with a complete picture.
$Report = New-Object System.Collections.Generic.List[object]

function Add-Report([string]$Name, [string]$Status, [string]$Detail = "") {
    $Report.Add([pscustomobject]@{ Stage = $Name; Status = $Status; Detail = $Detail })
}

function Write-Section([string]$Title) {
    Write-Host ""
    Write-Host ("=" * 70) -ForegroundColor DarkGray
    Write-Host $Title -ForegroundColor Cyan
    Write-Host ("=" * 70) -ForegroundColor DarkGray
}

# ---------------------------------------------------------------------
# 1. Python virtual environment (create or reuse)
# ---------------------------------------------------------------------
Write-Section "1/7  Python virtual environment"

$pythonSetupOk = $false
try {
    if (Test-Path $VenvPython) {
        Write-Host "Reusing existing virtual environment at $VenvDir"
    }
    else {
        $systemPython = Get-Command python -ErrorAction SilentlyContinue
        if (-not $systemPython) { $systemPython = Get-Command py -ErrorAction SilentlyContinue }
        if (-not $systemPython) {
            throw "No 'python' or 'py' launcher found on PATH. Install Python 3.11+ from https://python.org (check 'Add python.exe to PATH' during install), then re-run this script."
        }
        Write-Host "Creating virtual environment at $VenvDir using $($systemPython.Source) ..."
        & $systemPython.Source -m venv $VenvDir
        if ($LASTEXITCODE -ne 0) { throw "python -m venv exited with code $LASTEXITCODE" }
    }

    Write-Host "Installing dependencies from analysis\requirements.txt ..."
    & $VenvPython -m pip install --upgrade pip --quiet
    if ($LASTEXITCODE -ne 0) { throw "pip install --upgrade pip exited with code $LASTEXITCODE" }
    & $VenvPython -m pip install -r $AnalysisRequirements --quiet
    if ($LASTEXITCODE -ne 0) { throw "pip install -r analysis\requirements.txt exited with code $LASTEXITCODE" }

    Write-Host "Python environment ready." -ForegroundColor Green
    Add-Report "Python environment (venv + pip install)" "PASS"
    $pythonSetupOk = $true
}
catch {
    Write-Host "Python environment setup failed: $_" -ForegroundColor Red
    Add-Report "Python environment (venv + pip install)" "FAIL" "$_"
}

# ---------------------------------------------------------------------
# 2. FastF1 cache directory (create or reuse)
# ---------------------------------------------------------------------
Write-Section "2/7  FastF1 session cache"

if (Test-Path $CacheDir) {
    $cacheSizeMb = [math]::Round(((Get-ChildItem $CacheDir -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum / 1MB), 1)
    Write-Host "Reusing existing cache at $CacheDir ($cacheSizeMb MB). Never committed (see .gitignore)."
    Add-Report "FastF1 cache directory" "PASS" "Reused, $cacheSizeMb MB"
}
else {
    New-Item -ItemType Directory -Path $CacheDir -Force | Out-Null
    Write-Host "Created cache directory at $CacheDir. Never committed (see .gitignore)."
    Add-Report "FastF1 cache directory" "PASS" "Created"
}

# ---------------------------------------------------------------------
# 3. Generate the race library
# ---------------------------------------------------------------------
Write-Section "3/7  Generate race library"

if ($pythonSetupOk) {
    $genArgs = @("scripts\generate_batch.py")
    if ($YearSupplied -and $EventSupplied) {
        $genArgs += @("--year", $Year, "--event", $Event)
    }
    if ($Force) { $genArgs += "--force" }

    Push-Location $RepoRoot
    try {
        & $VenvPython @genArgs
        $genExitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }

    if ($genExitCode -eq 0) {
        Add-Report "Generate race library" "PASS" "scripts/generate_batch.py exit 0 -- see per-race summary above"
    }
    else {
        Add-Report "Generate race library" "FAIL" "scripts/generate_batch.py exited $genExitCode -- see per-race summary above"
    }
}
else {
    Write-Host "Skipped: Python environment setup failed above." -ForegroundColor Yellow
    Add-Report "Generate race library" "SKIP" "Python environment setup failed"
}

# ---------------------------------------------------------------------
# 4. Validate every committed analysis JSON file
# ---------------------------------------------------------------------
Write-Section "4/7  Validate generated JSON against the contract"

if ($pythonSetupOk) {
    Push-Location $RepoRoot
    try {
        & $VenvPython "scripts\validate_generated.py"
        $validateExitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }
    if ($validateExitCode -eq 0) {
        Add-Report "JSON validation (validate_generated.py)" "PASS"
    }
    else {
        Add-Report "JSON validation (validate_generated.py)" "FAIL" "exit $validateExitCode -- see output above"
    }
}
else {
    Add-Report "JSON validation (validate_generated.py)" "SKIP" "Python environment setup failed"
}

# ---------------------------------------------------------------------
# 5. Python test suite
# ---------------------------------------------------------------------
Write-Section "5/7  Python test suite (pytest)"

if ($pythonSetupOk) {
    Push-Location (Join-Path $RepoRoot "analysis")
    try {
        & $VenvPython -m pytest -q
        $pytestExitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }
    if ($pytestExitCode -eq 0) {
        Add-Report "Python tests (pytest)" "PASS"
    }
    else {
        Add-Report "Python tests (pytest)" "FAIL" "exit $pytestExitCode -- see output above"
    }
}
else {
    Add-Report "Python tests (pytest)" "SKIP" "Python environment setup failed"
}

# ---------------------------------------------------------------------
# 6. Frontend dependencies
# ---------------------------------------------------------------------
Write-Section "6/7  Frontend dependencies (npm install)"

$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
$frontendSetupOk = $false
if (-not $npmCmd) {
    Write-Host "No 'npm' found on PATH. Install Node.js 22 LTS from https://nodejs.org, then re-run this script." -ForegroundColor Yellow
    Add-Report "Frontend dependencies (npm install)" "SKIP" "npm not found on PATH"
}
else {
    Push-Location $WebDir
    try {
        & npm install
        $npmInstallExitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }
    if ($npmInstallExitCode -eq 0) {
        Add-Report "Frontend dependencies (npm install)" "PASS"
        $frontendSetupOk = $true
    }
    else {
        Add-Report "Frontend dependencies (npm install)" "FAIL" "exit $npmInstallExitCode -- see output above"
    }
}

# ---------------------------------------------------------------------
# 7. Frontend checks: test, typecheck, lint, build
# ---------------------------------------------------------------------
Write-Section "7/7  Frontend checks (test, typecheck, lint, build)"

function Invoke-NpmScript([string]$StageName, [string]$NpmScript) {
    if (-not $frontendSetupOk) {
        Add-Report $StageName "SKIP" "npm install did not succeed"
        return
    }
    Push-Location $WebDir
    try {
        & npm run $NpmScript
        $exitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }
    if ($exitCode -eq 0) {
        Add-Report $StageName "PASS"
    }
    else {
        Add-Report $StageName "FAIL" "npm run $NpmScript exited $exitCode -- see output above"
    }
}

Invoke-NpmScript "Frontend tests (vitest)" "test"
Invoke-NpmScript "Frontend typecheck" "typecheck"
Invoke-NpmScript "Frontend lint" "lint"
Invoke-NpmScript "Frontend production build" "build"

# ---------------------------------------------------------------------
# Final report
# ---------------------------------------------------------------------
Write-Section "FINAL REPORT"

$Report | ForEach-Object {
    $color = switch ($_.Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "SKIP" { "Yellow" }
        default { "White" }
    }
    $line = "  [{0,-4}] {1}" -f $_.Status, $_.Stage
    if ($_.Detail) { $line += "  -- $($_.Detail)" }
    Write-Host $line -ForegroundColor $color
}

$failCount = @($Report | Where-Object { $_.Status -eq "FAIL" }).Count
$skipCount = @($Report | Where-Object { $_.Status -eq "SKIP" }).Count
$passCount = @($Report | Where-Object { $_.Status -eq "PASS" }).Count

Write-Host ""
Write-Host "$passCount passed, $skipCount skipped, $failCount failed (of $($Report.Count) stages)."
Write-Host ""
Write-Host "Per-race generation detail (success/skipped/failed) is printed above under" -ForegroundColor DarkGray
Write-Host "'3/7  Generate race library' -- this final report is about the pipeline" -ForegroundColor DarkGray
Write-Host "stages (venv, cache, generation run, validation, tests, build), not each" -ForegroundColor DarkGray
Write-Host "individual race." -ForegroundColor DarkGray
Write-Host ""
Write-Host "The frontend reads data/generated/ and data/race-manifest.json directly" -ForegroundColor DarkGray
Write-Host "from disk at build/request time (see apps/web/lib/raceData.ts and" -ForegroundColor DarkGray
Write-Host "apps/web/lib/raceManifest.ts) -- there is no separate generated catalog" -ForegroundColor DarkGray
Write-Host "file to regenerate; committing data/generated and data/race-manifest.json" -ForegroundColor DarkGray
Write-Host "is what updates the frontend's race catalog." -ForegroundColor DarkGray
Write-Host ""

if ($failCount -gt 0) {
    Write-Host "Review the FAIL rows above, fix, and re-run before committing." -ForegroundColor Red
    exit 1
}

Write-Host "Review 'git status' / 'git diff' for data/generated (and data/race-manifest.json" -ForegroundColor Green
Write-Host "if you edited it), then commit and push when you're satisfied." -ForegroundColor Green
exit 0
