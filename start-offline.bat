@echo off
chcp 65001 >nul
title Project Tracker - 離線安裝版

echo ========================================
echo   Project Tracker v2.0 (離線版)
echo   專案追蹤管理系統
echo ========================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [錯誤] 找不到 Python，請先安裝 Python 3.10+
    pause
    exit /b 1
)

:: Check if packages folder exists
if not exist "packages" (
    echo [錯誤] 找不到 packages 資料夾
    echo 請先在可上網的電腦執行以下指令準備套件：
    echo.
    echo   pip download -r requirements-portable.txt -d packages/
    echo.
    pause
    exit /b 1
)

:: Check if venv exists, if not create it
if not exist "venv" (
    echo [設定] 首次執行，正在建立虛擬環境...
    python -m venv venv
)

:: Activate venv
call venv\Scripts\activate.bat

:: Install from local packages
if not exist "venv\Lib\site-packages\fastapi" (
    echo [設定] 正在從本地安裝套件...
    pip install --no-index --find-links=packages/ -r requirements-portable.txt --quiet
    if errorlevel 1 (
        echo [錯誤] 套件安裝失敗
        pause
        exit /b 1
    )
)

:: Initialize database if needed
if not exist "data\project_tracking.db" (
    echo [設定] 正在初始化資料庫...
    python -c "from backend.init_db import create_database_schema; create_database_schema()"
)

echo.
echo [啟動] 伺服器啟動中...
echo.
echo ========================================
echo   請在瀏覽器開啟: http://localhost:8000
echo   按 Ctrl+C 停止伺服器
echo ========================================
echo.

:: Start the server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000

pause
