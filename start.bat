@echo off
chcp 65001 >nul
title Project Tracker - 專案追蹤管理系統

echo ========================================
echo   Project Tracker v2.0
echo   專案追蹤管理系統
echo ========================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [錯誤] 找不到 Python，請先安裝 Python 3.10+
    echo 下載地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

:: Check if venv exists, if not create it
if not exist "venv" (
    echo [設定] 首次執行，正在建立虛擬環境...
    python -m venv venv
    if errorlevel 1 (
        echo [錯誤] 無法建立虛擬環境
        pause
        exit /b 1
    )
)

:: Activate venv
call venv\Scripts\activate.bat

:: Install dependencies if needed
if not exist "venv\Lib\site-packages\fastapi" (
    echo [設定] 正在安裝必要套件...
    pip install -r requirements-portable.txt --quiet
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
