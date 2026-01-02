@echo off
chcp 65001 >nul
echo ========================================
echo   下載離線安裝套件
echo ========================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [錯誤] 找不到 Python
    pause
    exit /b 1
)

:: Create packages folder
if not exist "packages" mkdir packages

echo [下載] 正在下載 Windows 版套件...
pip download -r requirements-portable.txt -d packages/ --only-binary=:all: --platform win_amd64 --python-version 3.10

if errorlevel 1 (
    echo.
    echo [提示] 部分套件可能需要原始碼編譯，嘗試下載通用版...
    pip download -r requirements-portable.txt -d packages/
)

echo.
echo ========================================
echo   下載完成！
echo   packages 資料夾可帶到離線電腦使用
echo ========================================
pause
