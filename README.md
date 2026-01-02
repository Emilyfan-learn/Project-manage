# Project Tracker - 專案追蹤管理系統

一個輕量級的專案追蹤和管理系統，整合 WBS 管理、問題追蹤、待辦事項和甘特圖功能。

## 功能特色

- **專案管理** - 建立和管理多個專案
- **WBS 管理** - 工作分解結構管理，支援樹狀圖檢視
- **依賴關係** - 任務之間的依賴關係管理
- **待辦清單** - 追蹤待辦事項和回覆狀態
- **問題追蹤** - 完整的問題追蹤系統，支援升級和解決流程
- **甘特圖** - 視覺化專案時程
- **備份管理** - 資料備份和還原功能
- **Excel 匯入/匯出** - 支援 Excel 格式的資料匯入匯出（完整版）

---

## 快速安裝（Windows 便攜版）

### 環境需求
- **只需要 Python 3.10+**（不需要 Node.js）
- 前端已預先建構完成

### 一鍵啟動

1. **下載專案**
   - 從 GitHub 下載 ZIP 並解壓縮
   - 或使用 `git clone`

2. **執行 `start.bat`**
   ```
   雙擊 start.bat
   ```

3. **開啟瀏覽器**
   ```
   http://localhost:8000
   ```

首次執行會自動：
- 建立 Python 虛擬環境
- 安裝必要套件（約 20MB）
- 初始化資料庫

### 離線安裝（公司網路受限）

如果公司無法連接 PyPI，可以在家裡先準備好套件：

```bash
# 在可上網的電腦執行
pip download -r requirements-portable.txt -d packages/
```

然後把 `packages/` 資料夾一起帶到公司，修改安裝指令：
```bash
pip install --no-index --find-links=packages/ -r requirements-portable.txt
```

---

## 完整安裝（開發者版本）

### 環境需求
- Python 3.10 或更高版本
- Node.js 18 或更高版本（僅開發時需要）

### 後端設定

```bash
# 建立虛擬環境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安裝完整依賴（含 Excel 功能）
pip install -r requirements.txt

# 啟動後端伺服器
python -m uvicorn backend.main:app --reload
```

### 前端開發

```bash
cd frontend
npm install
npm run dev      # 開發模式
npm run build    # 建構生產版本
```

---

## 版本比較

| 功能 | 便攜版 | 完整版 |
|------|--------|--------|
| 專案管理 | ✅ | ✅ |
| WBS 管理 | ✅ | ✅ |
| 依賴關係 | ✅ | ✅ |
| 待辦清單 | ✅ | ✅ |
| 問題追蹤 | ✅ | ✅ |
| 甘特圖 | ✅ | ✅ |
| 備份管理 | ✅ | ✅ |
| Excel 匯入/匯出 | ❌ | ✅ |
| 安裝大小 | ~20MB | ~150MB |
| 需要 Node.js | ❌ | ✅（開發時）|

---

## 專案結構

```
Project-manage/
├── backend/
│   ├── models/            # Pydantic 模型
│   ├── routers/           # API 路由
│   ├── services/          # 業務邏輯
│   ├── config.py          # 設定檔
│   ├── init_db.py         # 資料庫初始化
│   └── main.py            # 應用程式入口
├── frontend/
│   ├── dist/              # 預建構的前端（便攜版使用）
│   └── src/               # 前端原始碼
├── data/                  # 資料庫和備份
├── start.bat              # Windows 一鍵啟動
├── requirements-portable.txt  # 精簡依賴
└── requirements.txt       # 完整依賴
```

## API 文件

啟動後可訪問：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 授權

MIT License
