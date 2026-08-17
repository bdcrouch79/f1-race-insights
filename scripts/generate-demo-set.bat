@echo off
REM Double-click this to generate the curated race library defined in
REM data\race-manifest.json. Safe to run any time -- races that already
REM have a valid analysis are skipped, and races that fail just get
REM reported at the end; nothing is committed automatically.
REM
REM scripts\build-race-library.ps1 is the full Phase 1 entry point (venv
REM setup, dependency install, generation, validation, tests, and
REM build) -- this .bat is a lighter-weight generation-only shortcut for
REM whoever prefers double-clicking over PowerShell.

cd /d "%~dp0\.."

if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) else (
    echo No .venv found in the repo root -- using whatever "python" resolves to.
    echo If this fails with a missing-module error, run:
    echo   python -m venv .venv
    echo   .venv\Scripts\activate
    echo   pip install -r analysis\requirements.txt
    echo then try again.
)

python scripts\generate_batch.py

pause
