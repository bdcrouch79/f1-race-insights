<#
.SYNOPSIS
    RaceIQ Phase 3 Social Content Engine: generate a deterministic social
    media content package for one already-committed race analysis.

.DESCRIPTION
    Windows entry point for scripts/generate_race_content.py. Does not
    call FastF1, does not touch analysis/raceiq/ (the engine) or its
    contract, does not call an LLM, and does not introduce a new
    analytical metric -- it only reads an already-committed, already
    schema-valid data/generated/raceiq/**/R.json file plus
    data/race-manifest.json, and formats/visualizes fields those already
    contain. See docs/DECISIONS.md.

    Requires the race to already be generated and committed (run
    scripts\build-race-library.ps1 first if it isn't). Requires the same
    Python virtual environment build-race-library.ps1 sets up
    (analysis/requirements.txt, which already includes matplotlib) -- no
    network access is required for this step.

.PARAMETER Year
    The race season, e.g. 2021.

.PARAMETER Event
    The manifest event query or a substring of the real event name, e.g.
    "Abu Dhabi". Case-insensitive.

.PARAMETER OutRoot
    Output root directory. Defaults to content\generated.

.EXAMPLE
    .\scripts\build-race-content.ps1 -Year 2021 -Event "Abu Dhabi"
    Generates content\generated\2021-abu-dhabi-grand-prix\ with five
    social post drafts, one content-manifest.json, and three insight-card
    PNGs.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][int]$Year,
    [Parameter(Mandatory = $true)][string]$Event,
    [string]$OutRoot
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$RepoRoot = Split-Path -Parent $PSScriptRoot
$VenvDir = Join-Path $RepoRoot ".venv"
$VenvPython = Join-Path $VenvDir "Scripts\python.exe"
$AnalysisRequirements = Join-Path $RepoRoot "analysis\requirements.txt"

if (-not (Test-Path $VenvPython)) {
    $systemPython = Get-Command python -ErrorAction SilentlyContinue
    if (-not $systemPython) { $systemPython = Get-Command py -ErrorAction SilentlyContinue }
    if (-not $systemPython) {
        Write-Error "No 'python' or 'py' launcher found on PATH, and no existing .venv. Install Python 3.11+ from https://python.org, or run scripts\build-race-library.ps1 first to set up .venv."
        exit 2
    }
    Write-Host "No .venv found -- creating one at $VenvDir using $($systemPython.Source) ..."
    & $systemPython.Source -m venv $VenvDir
    if ($LASTEXITCODE -ne 0) { Write-Error "python -m venv exited with code $LASTEXITCODE"; exit 1 }
    & $VenvPython -m pip install --upgrade pip --quiet
    & $VenvPython -m pip install -r $AnalysisRequirements --quiet
    if ($LASTEXITCODE -ne 0) { Write-Error "pip install -r analysis\requirements.txt exited with code $LASTEXITCODE"; exit 1 }
}

$pyArgs = @("scripts\generate_race_content.py", $Year, $Event)
if ($PSBoundParameters.ContainsKey('OutRoot')) {
    $pyArgs += @("--out-root", $OutRoot)
}

Push-Location $RepoRoot
try {
    & $VenvPython @pyArgs
    $exitCode = $LASTEXITCODE
}
finally {
    Pop-Location
}

if ($exitCode -ne 0) {
    Write-Host "Content generation failed (exit $exitCode) -- see output above." -ForegroundColor Red
    exit $exitCode
}

Write-Host ""
Write-Host "Review the generated files, then commit and push content\generated\ yourself -- this script never runs git." -ForegroundColor Green
exit 0
