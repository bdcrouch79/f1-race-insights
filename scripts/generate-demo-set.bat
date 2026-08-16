@echo off
REM Double-click this to generate a curated set of real, well-known
REM races for a strong first demo. Safe to run any time -- races that
REM fail just get skipped (printed at the end), nothing is committed
REM automatically.

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
