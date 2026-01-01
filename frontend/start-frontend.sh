#!/bin/bash
# 啟動前端開發服務器腳本

cd "$(dirname "$0")"

echo "🚀 正在啟動 Project Tracker 前端服務..."
echo "📍 前端地址: http://localhost:5173"
echo "📍 WBS 管理: http://localhost:5173/wbs"
echo ""
echo "💡 請確保後端服務已啟動在 http://localhost:8000"
echo ""

npm run dev
