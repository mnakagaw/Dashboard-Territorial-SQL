@echo off
setlocal
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo Python 3 is required but was not found.
  pause
  exit /b 1
)

if not exist "sqlite\dashboard_territorial.sqlite3" (
  python scripts\sqlite_tool.py init
  if errorlevel 1 goto :error
)

if not exist "dist\index.html" (
  echo The dashboard build is missing.
  echo Run: npm install
  echo Then: npm run build:sqlite
  pause
  exit /b 1
)

start "" "http://127.0.0.1:8000/dbt/"
python scripts\sqlite_server.py
exit /b %errorlevel%

:error
echo SQLite initialization failed.
pause
exit /b 1
