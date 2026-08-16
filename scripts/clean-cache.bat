@echo off
REM Double-click this file to delete the local FastF1 cache.
REM Safe to run any time: this only deletes downloaded session data that
REM FastF1 re-downloads automatically next time you generate a race. It
REM does not touch anything committed to git.

cd /d "%~dp0\.."

if not exist "cache" (
    echo No cache folder found -- nothing to clean.
    pause
    exit /b 0
)

echo Current cache size:
for /f "usebackq" %%A in (`powershell -NoProfile -Command "'{0:N1} MB' -f ((Get-ChildItem cache -Recurse -File | Measure-Object Length -Sum).Sum / 1MB)"`) do echo %%A

echo.
set /p CONFIRM="Delete the cache folder now? (y/n): "
if /i "%CONFIRM%"=="y" (
    rmdir /s /q cache
    echo Cache deleted. The next race you generate will re-download from FastF1.
) else (
    echo Cancelled -- nothing deleted.
)

pause
