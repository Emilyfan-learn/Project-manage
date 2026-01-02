@echo off
chcp 65001 >nul 2>&1
title Project Tracker

echo ========================================
echo   Project Tracker v2.0
echo   Offline Installation
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.10+
    pause
    exit /b 1
)

REM Check if packages folder exists
if not exist "packages" (
    echo [ERROR] packages folder not found
    echo Please download the complete project with packages folder
    pause
    exit /b 1
)

REM Check if venv exists, if not create it
if not exist "venv" (
    echo [SETUP] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate venv
call venv\Scripts\activate.bat

REM Install from local packages
if not exist "venv\Lib\site-packages\fastapi" (
    echo [SETUP] Installing packages from local folder...
    pip install --no-index --find-links=packages/ -r requirements-portable.txt
    if errorlevel 1 (
        echo [ERROR] Package installation failed
        pause
        exit /b 1
    )
)

REM Initialize database if needed
if not exist "data\project_tracking.db" (
    echo [SETUP] Initializing database...
    python -c "from backend.init_db import create_database_schema; create_database_schema()"
)

echo.
echo [START] Starting server...
echo.
echo ========================================
echo   Open browser: http://localhost:8000
echo   Press Ctrl+C to stop
echo ========================================
echo.

REM Start the server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000

pause
