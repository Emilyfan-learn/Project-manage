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
- **Excel 匯入/匯出** - 支援 Excel 格式的資料匯入匯出

## 技術架構

### 後端
- **Python 3.10+**
- **FastAPI** - 高效能的 Web 框架
- **SQLite** - 輕量級資料庫
- **SQLAlchemy** - ORM 框架
- **Pydantic** - 資料驗證

### 前端
- **React 18** - UI 框架
- **Vite** - 建構工具
- **Tailwind CSS** - CSS 框架
- **React Router** - 路由管理
- **Recharts** - 圖表元件
- **Frappe Gantt** - 甘特圖元件

## 安裝與執行

### 環境需求
- Python 3.10 或更高版本
- Node.js 18 或更高版本
- npm 或 yarn

### 後端設定

```bash
# 建立虛擬環境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安裝依賴
pip install -r requirements.txt

# 啟動後端伺服器
cd backend
python main.py
```

後端伺服器預設執行於 http://localhost:8000

### 前端設定

```bash
# 進入前端目錄
cd frontend

# 安裝依賴
npm install

# 開發模式執行
npm run dev

# 建構生產版本
npm run build
```

前端開發伺服器預設執行於 http://localhost:5173

## 專案結構

```
Project-manage/
├── backend/
│   ├── database/          # SQL 腳本
│   ├── migrations/        # 資料庫遷移
│   ├── models/            # Pydantic 模型
│   ├── routers/           # API 路由
│   ├── services/          # 業務邏輯
│   ├── config.py          # 設定檔
│   ├── database.py        # 資料庫連線
│   ├── init_db.py         # 資料庫初始化
│   └── main.py            # 應用程式入口
├── frontend/
│   ├── src/
│   │   ├── components/    # React 元件
│   │   ├── hooks/         # 自訂 Hooks
│   │   ├── pages/         # 頁面元件
│   │   ├── styles/        # 樣式檔案
│   │   ├── utils/         # 工具函數
│   │   ├── App.jsx        # 主應用程式
│   │   └── main.jsx       # 入口點
│   ├── package.json
│   └── vite.config.js
├── data/                  # 資料庫和備份
├── logs/                  # 日誌檔案
├── requirements.txt       # Python 依賴
└── README.md
```

## API 文件

啟動後端伺服器後，可以訪問以下網址查看 API 文件：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 授權

MIT License
