# 專案管理系統規格文件

## 文件版本
- **版本**: v2.0
- **日期**: 2024-12-12
- **狀態**: 完整版（含 Web 介面規格）

---

## 專案概述

### 目標
建立一個輕量化的個人專案追蹤管理系統，解決以下痛點：
1. WBS 和 Meeting Action Item 資訊分散，無法統一檢視
2. 需要快速產生不同對象的報告（團隊/長官/客戶）
3. 追蹤項目的 Impact 關聯難以掌握
4. 時程管控需要完整的三階段追蹤（計畫/調整/實際）

### 系統定位
- **使用者**: 個人使用（單一使用者）
- **平台**: Mac 電腦本機部署
- **目標**: 輕量、快速、簡單

### 設計原則
1. **輕量化**: 最小依賴、快速啟動
2. **單機運行**: 不需要網路即可使用
3. **一鍵啟動**: 雙擊即可開啟系統
4. **資料本地化**: 所有資料存放在本機

### 技術棧
| 層級 | 技術 | 選擇理由 |
|------|------|---------|
| 後端 | **FastAPI** | 輕量、效能好、自動 API 文件 |
| 前端 | **React + Vite** | 開發快速、打包後體積小 |
| 資料庫 | **SQLite** | 單檔案、免安裝、易備份 |
| 資料處理 | **pandas, openpyxl** | Excel 匯入匯出 |
| 圖表 | **Recharts** | 輕量、React 友好 |
| 甘特圖 | **frappe-gantt** | 專業甘特圖元件、免費輕量 |
| CSS | **Tailwind CSS** | 開發效率高、打包後體積小 |

---

## 系統架構

### 架構圖

```
┌─────────────────────────────────────────────────────────┐
│                      Mac 電腦                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │              瀏覽器 (Chrome/Safari)              │   │
│  │         http://localhost:8000                   │   │
│  └─────────────────────────────────────────────────┘   │
│                         ↓                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │            FastAPI 後端服務                      │   │
│  │         (內嵌靜態檔案服務)                       │   │
│  │                Port: 8000                        │   │
│  └─────────────────────────────────────────────────┘   │
│                         ↓                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │              SQLite 資料庫                       │   │
│  │      data/project_tracking.db                   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 目錄結構

```
project-tracker/
├── 啟動系統.command               # Mac 一鍵啟動腳本
├── 停止系統.command               # 停止服務腳本
├── 安裝依賴.command               # 首次安裝腳本
├── requirements.txt               # Python 依賴
├── README.md                      # 說明文件
├── CLAUDE.md                      # Claude Code 專案說明
│
├── backend/
│   ├── main.py                    # FastAPI 入口
│   ├── config.py                  # 設定檔
│   ├── database.py                # 資料庫連線
│   ├── init_db.py                 # 資料庫初始化
│   │
│   ├── routers/                   # API 路由
│   │   ├── projects.py            # 專案 API
│   │   ├── wbs.py                 # WBS API
│   │   ├── issues.py              # Issue API
│   │   ├── pending.py             # 待辦 API
│   │   ├── reports.py             # 報表 API
│   │   ├── gantt.py               # 甘特圖 API
│   │   └── notifications.py       # 通知 API
│   │
│   ├── services/                  # 業務邏輯
│   │   ├── wbs_service.py
│   │   ├── issue_service.py
│   │   ├── pending_service.py
│   │   ├── notification_service.py
│   │   ├── gantt_service.py
│   │   ├── report_service.py
│   │   ├── import_service.py      # Excel 匯入
│   │   └── backup_service.py      # 備份服務
│   │
│   └── models/                    # Pydantic 模型
│       ├── wbs.py
│       ├── issue.py
│       ├── pending.py
│       └── notification.py
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   │
│   │   ├── components/            # 共用元件
│   │   │   ├── Layout.jsx         # 主版面
│   │   │   ├── Sidebar.jsx        # 側邊欄
│   │   │   ├── NotificationBell.jsx
│   │   │   └── GanttChart.jsx
│   │   │
│   │   ├── pages/                 # 頁面
│   │   │   ├── Dashboard.jsx      # 儀表板
│   │   │   ├── WBSList.jsx        # WBS 清單
│   │   │   ├── GanttView.jsx      # 甘特圖頁面
│   │   │   ├── Issues.jsx         # 問題管理
│   │   │   ├── Pending.jsx        # 待辦清單
│   │   │   ├── Reports.jsx        # 報表
│   │   │   └── Settings.jsx       # 設定
│   │   │
│   │   ├── hooks/                 # 自訂 Hooks
│   │   │   ├── useNotifications.js
│   │   │   └── useProjects.js
│   │   │
│   │   └── styles/
│   │       └── index.css
│   │
│   └── dist/                      # 打包後的靜態檔案
│
└── data/
    ├── project_tracking.db        # 主資料庫
    └── backups/                   # 備份目錄
        ├── daily/
        ├── weekly/
        ├── monthly/
        └── manual/
```

---

## 資料備份與安全策略

### 備份策略設計

#### 1. 自動備份機制

**每日自動備份**:
```python
# 每天自動執行
- 時間: 每日 23:00
- 位置: data/backups/daily/
- 命名: project_tracking_YYYYMMDD.db
- 保留: 最近 30 天
```

**每週完整備份**:
```python
# 每週日執行
- 時間: 每週日 23:30
- 位置: data/backups/weekly/
- 命名: project_tracking_YYYY_W##.db
- 保留: 最近 12 週
```

**每月歸檔備份**:
```python
# 每月最後一天執行
- 時間: 每月最後一天 23:45
- 位置: data/backups/monthly/
- 命名: project_tracking_YYYY_MM.db
- 保留: 永久保存
```

#### 2. 備份腳本實作

```python
# src/backup/auto_backup.py
import shutil
import sqlite3
from datetime import datetime
import os

class BackupManager:
    def __init__(self, db_path, backup_base_path='data/backups'):
        self.db_path = db_path
        self.backup_base_path = backup_base_path
        self.ensure_backup_dirs()
    
    def ensure_backup_dirs(self):
        """確保備份目錄存在"""
        dirs = ['daily', 'weekly', 'monthly', 'manual']
        for d in dirs:
            os.makedirs(f"{self.backup_base_path}/{d}", exist_ok=True)
    
    def backup_database(self, backup_type='manual'):
        """執行資料庫備份"""
        timestamp = datetime.now()
        
        if backup_type == 'daily':
            filename = f"project_tracking_{timestamp.strftime('%Y%m%d')}.db"
            backup_path = f"{self.backup_base_path}/daily/{filename}"
        elif backup_type == 'weekly':
            week_num = timestamp.strftime('%W')
            filename = f"project_tracking_{timestamp.year}_W{week_num}.db"
            backup_path = f"{self.backup_base_path}/weekly/{filename}"
        elif backup_type == 'monthly':
            filename = f"project_tracking_{timestamp.strftime('%Y_%m')}.db"
            backup_path = f"{self.backup_base_path}/monthly/{filename}"
        else:  # manual
            filename = f"project_tracking_manual_{timestamp.strftime('%Y%m%d_%H%M%S')}.db"
            backup_path = f"{self.backup_base_path}/manual/{filename}"
        
        # 使用 SQLite 的 backup API (更安全)
        try:
            source = sqlite3.connect(self.db_path)
            dest = sqlite3.connect(backup_path)
            source.backup(dest)
            source.close()
            dest.close()
            print(f"✓ 備份成功: {backup_path}")
            return backup_path
        except Exception as e:
            print(f"✗ 備份失敗: {e}")
            return None
    
    def cleanup_old_backups(self):
        """清理過期的備份檔案"""
        # 清理 30 天前的每日備份
        self._cleanup_directory(
            f"{self.backup_base_path}/daily",
            days=30
        )
        
        # 清理 12 週前的每週備份
        self._cleanup_directory(
            f"{self.backup_base_path}/weekly",
            days=84  # 12 weeks
        )
        
        # 月度備份永久保留,不清理
    
    def _cleanup_directory(self, directory, days):
        """清理指定天數前的檔案"""
        import time
        now = time.time()
        cutoff = now - (days * 86400)
        
        for filename in os.listdir(directory):
            filepath = os.path.join(directory, filename)
            if os.path.getmtime(filepath) < cutoff:
                os.remove(filepath)
                print(f"✓ 清理舊備份: {filename}")
    
    def restore_from_backup(self, backup_path):
        """從備份還原資料庫"""
        if not os.path.exists(backup_path):
            print(f"✗ 備份檔案不存在: {backup_path}")
            return False
        
        # 先備份當前資料庫
        current_backup = self.backup_database('manual')
        print(f"✓ 已備份當前資料庫: {current_backup}")
        
        # 還原備份
        try:
            shutil.copy2(backup_path, self.db_path)
            print(f"✓ 還原成功: {backup_path}")
            return True
        except Exception as e:
            print(f"✗ 還原失敗: {e}")
            return False
    
    def export_to_excel(self, output_path):
        """匯出資料庫所有資料到 Excel (額外備份)"""
        import pandas as pd
        conn = sqlite3.connect(self.db_path)
        
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            # 匯出所有資料表
            tables = ['tracking_items', 'item_dependencies', 
                     'schedule_changes', 'pending_items']
            
            for table in tables:
                df = pd.read_sql_query(f"SELECT * FROM {table}", conn)
                df.to_excel(writer, sheet_name=table, index=False)
        
        conn.close()
        print(f"✓ Excel 備份成功: {output_path}")
```

#### 3. 排程設定

**Linux/Mac (使用 crontab)**:
```bash
# 編輯 crontab
crontab -e

# 加入排程
# 每日 23:00 備份
0 23 * * * /usr/bin/python3 /path/to/src/backup/schedule_backup.py daily

# 每週日 23:30 備份
30 23 * * 0 /usr/bin/python3 /path/to/src/backup/schedule_backup.py weekly

# 每月最後一天 23:45 備份
45 23 28-31 * * [ $(date -d tomorrow +\%d) -eq 1 ] && /usr/bin/python3 /path/to/src/backup/schedule_backup.py monthly
```

**Windows (使用 Task Scheduler)**:
```powershell
# 建立每日備份任務
schtasks /create /tn "ProjectTracking_DailyBackup" /tr "python C:\path\to\src\backup\schedule_backup.py daily" /sc daily /st 23:00

# 建立每週備份任務
schtasks /create /tn "ProjectTracking_WeeklyBackup" /tr "python C:\path\to\src\backup\schedule_backup.py weekly" /sc weekly /d SUN /st 23:30
```

#### 4. 雲端同步方案

**方案 A: Dropbox/Google Drive 同步**
```python
# 將備份目錄放在雲端同步資料夾
backup_base_path = '~/Dropbox/ProjectTracking/backups'
# 或
backup_base_path = '~/Google Drive/ProjectTracking/backups'

# 檔案會自動同步到雲端
```

**方案 B: Git 版本控制**
```bash
# 初始化 Git 倉庫
cd data/backups
git init
git add .
git commit -m "Backup $(date +%Y%m%d)"

# 推送到遠端 (GitHub/GitLab)
git remote add origin https://github.com/yourname/project-backups.git
git push origin main
```

**方案 C: 自動上傳到 AWS S3**
```python
# src/backup/cloud_backup.py
import boto3
from datetime import datetime

def upload_to_s3(local_file, bucket_name):
    s3 = boto3.client('s3')
    s3_key = f"backups/{datetime.now().strftime('%Y/%m')}/{os.path.basename(local_file)}"
    s3.upload_file(local_file, bucket_name, s3_key)
    print(f"✓ 已上傳到 S3: {s3_key}")
```

#### 5. 災難復原計畫

**資料遺失情境處理**:

| 情境 | 復原方式 | 資料損失 |
|------|---------|---------|
| 誤刪資料 | 從最近的每日備份還原 | 最多 1 天 |
| 資料庫損壞 | 從最近的週備份還原 | 最多 7 天 |
| 電腦硬碟故障 | 從雲端備份下載還原 | 最多 1 天 |
| 所有本地備份遺失 | 從雲端/Git 還原 | 最多 1 天 |

**復原步驟**:
```bash
# 1. 列出可用的備份
ls -lh data/backups/daily/
ls -lh data/backups/weekly/

# 2. 選擇要還原的備份
python src/backup/restore.py --backup data/backups/daily/project_tracking_20241127.db

# 3. 驗證資料
python src/backup/verify_data.py
```

#### 6. 資料完整性檢查

```python
# src/backup/verify_data.py
def verify_database_integrity(db_path):
    """檢查資料庫完整性"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # SQLite 內建完整性檢查
        cursor.execute("PRAGMA integrity_check")
        result = cursor.fetchone()
        
        if result[0] == 'ok':
            print("✓ 資料庫完整性檢查通過")
            
            # 檢查關鍵資料表
            tables = ['tracking_items', 'item_dependencies', 'pending_items']
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"  - {table}: {count} 筆記錄")
            
            return True
        else:
            print(f"✗ 資料庫完整性檢查失敗: {result}")
            return False
            
    except Exception as e:
        print(f"✗ 檢查過程發生錯誤: {e}")
        return False
    finally:
        conn.close()
```

#### 7. 備份最佳實踐

**3-2-1 備份原則**:
- **3** 份資料副本 (原始 + 2 份備份)
- **2** 種不同儲存媒體 (本機硬碟 + 雲端)
- **1** 份異地備份 (雲端或外接硬碟)

**實際應用**:
```
副本 1: 原始資料庫 (工作機)
副本 2: 每日本地備份 (工作機)
副本 3: 雲端同步備份 (Dropbox/Google Drive)
```

#### 8. 使用者介面

**一鍵備份按鈕** (未來 Web 介面):
```
[⚙️ 系統設定]
├─ 📦 立即備份
│   └─ [執行手動備份]
│
├─ 🔄 自動備份設定
│   ├─ ☑ 啟用每日備份 (23:00)
│   ├─ ☑ 啟用每週備份 (週日 23:30)
│   └─ ☑ 啟用每月備份
│
├─ ☁️ 雲端同步
│   ├─ [ ] Dropbox
│   ├─ [ ] Google Drive
│   └─ [ ] AWS S3
│
└─ 📋 備份記錄
    ├─ 2024-11-27 23:00 每日備份 ✓
    ├─ 2024-11-24 23:30 每週備份 ✓
    └─ 2024-11-01 23:45 月度備份 ✓
```

#### 9. 監控與警示

```python
# src/backup/monitor.py
def check_backup_health():
    """檢查備份健康狀態"""
    issues = []
    
    # 檢查最近一次備份時間
    latest_backup = get_latest_backup_time()
    if (datetime.now() - latest_backup).days > 1:
        issues.append("⚠️ 超過 1 天未進行備份")
    
    # 檢查備份檔案大小
    if check_backup_size_abnormal():
        issues.append("⚠️ 備份檔案大小異常")
    
    # 檢查雲端同步狀態
    if not check_cloud_sync():
        issues.append("⚠️ 雲端同步失敗")
    
    if issues:
        send_alert(issues)  # 發送 Email 或系統通知
    
    return len(issues) == 0
```

---

## WBS 項目管理功能

### 功能設計

#### 1. 手動新增 WBS 項目

**新增單一 WBS**:
```python
def add_wbs_item_manually(project_id, wbs_data):
    """
    手動新增 WBS 項目
    
    wbs_data 範例:
    {
        'wbs_id': '2.3',
        'task_name': '資料庫設計',
        'parent_id': '2',
        'category': 'Task',
        'owner_unit': '開發部',
        'original_planned_start': '12/01/2024',
        'original_planned_end': '12/10/2024',
        'priority': 'High'
    }
    """
```

#### 2. 在兩個 WBS 中間插入

**方式 A: 使用小數點編號 (推薦)**:
```python
def insert_wbs_between(project_id, after_wbs, before_wbs, new_task_data):
    """
    在兩個 WBS 之間插入新項目
    
    範例: insert_wbs_between('PRJ001', '1.1', '1.2', task_data)
    
    原本:
    1.1 需求訪談
    1.2 需求文件
    
    插入後:
    1.1 需求訪談
    1.1.5 需求補充訪談  ← 新插入
    1.2 需求文件
    
    策略:
    - 如果是 1.1 和 1.2 之間 → 建立 1.1.5
    - 如果是 1.1.5 和 1.2 之間 → 建立 1.1.7
    - 自動找到可用的中間編號
    """
    
    # 解析 WBS 編號
    after_parts = after_wbs.split('.')
    before_parts = before_wbs.split('.')
    
    # 生成中間編號
    if len(after_parts) == len(before_parts):
        new_wbs_id = f"{after_wbs}.5"
    else:
        new_wbs_id = generate_middle_wbs_id(after_wbs, before_wbs)
    
    new_task_data['wbs_id'] = new_wbs_id
    new_task_data['parent_id'] = '.'.join(after_parts[:-1]) if len(after_parts) > 1 else after_parts[0]
    
    return add_wbs_item_manually(project_id, new_task_data)
```

**方式 B: 重新編號後續項目**:
```python
def insert_and_renumber(project_id, insert_after, new_task_data):
    """
    插入新項目並重新編號後續項目
    
    範例: 在 1.1 之後插入,原本的 1.2 變成 1.3
    
    原本:
    1.1 需求訪談
    1.2 需求文件
    1.3 需求審核
    
    插入後:
    1.1 需求訪談
    1.2 需求補充訪談  ← 新插入
    1.3 需求文件      ← 原本的 1.2
    1.4 需求審核      ← 原本的 1.3
    """
    
    # 1. 找出需要重新編號的項目
    items_to_renumber = get_items_after(insert_after)
    
    # 2. 更新 WBS 編號 (從後往前,避免衝突)
    for item in reversed(items_to_renumber):
        new_wbs = increment_wbs_id(item['wbs_id'])
        update_wbs_id_with_cascade(item['wbs_id'], new_wbs)
    
    # 3. 插入新項目
    new_wbs_id = increment_wbs_id(insert_after)
    new_task_data['wbs_id'] = new_wbs_id
    add_wbs_item_manually(project_id, new_task_data)
    
    return {
        'success': True,
        'new_wbs_id': new_wbs_id,
        'renumbered_count': len(items_to_renumber)
    }
```

#### 3. 修改 WBS 項目

```python
def update_wbs_item(item_id, updates):
    """
    修改 WBS 項目
    
    可修改的欄位:
    - task_name (任務名稱)
    - owner_unit (負責單位)
    - 所有日期欄位 (original/revised/actual)
    - actual_progress (進度)
    - status (狀態)
    - notes (備註)
    - priority (優先級)
    
    注意: 修改 wbs_id 會觸發連鎖更新機制
    """
```

#### 4. WBS 編號變更的連鎖更新機制

**核心功能: 自動同步所有關聯資料**:
```python
def update_wbs_id_with_cascade(old_wbs_id, new_wbs_id):
    """
    更新 WBS ID 並同步更新所有關聯資料
    
    更新範圍:
    1. tracking_items 表 (WBS 本身)
    2. issue_tracking 表的 affected_wbs
    3. tracking_items 表的 parent_id (Action Items)
    4. pending_items 表的 related_wbs
    5. item_dependencies 表的前後置關係
    """
    
    changes_log = {
        'wbs_updated': 0,
        'issues_updated': 0,
        'actions_updated': 0,
        'pending_updated': 0,
        'dependencies_updated': 0
    }
    
    # 1. 更新 WBS 本身
    update_tracking_item_wbs(old_wbs_id, new_wbs_id)
    changes_log['wbs_updated'] = 1
    
    # 2. 更新 Issue Tracking
    issues = get_issues_by_affected_wbs(old_wbs_id)
    for issue in issues:
        # 處理 affected_wbs 欄位 (可能包含多個 WBS,逗號分隔)
        affected_list = issue['affected_wbs'].split(',')
        affected_list = [new_wbs_id if wbs.strip() == old_wbs_id else wbs 
                        for wbs in affected_list]
        
        update_issue(issue['issue_id'], {
            'affected_wbs': ','.join(affected_list)
        })
        
        # 記錄變更歷史
        log_issue_field_change(
            issue_id=issue['issue_id'],
            field_name='affected_wbs',
            old_value=old_wbs_id,
            new_value=new_wbs_id,
            reason=f'WBS 編號變更: {old_wbs_id} → {new_wbs_id}'
        )
        
        changes_log['issues_updated'] += 1
    
    # 3. 更新 Action Items 的關聯
    actions = get_action_items_by_wbs(old_wbs_id)
    for action in actions:
        update_tracking_item(action['item_id'], {
            'parent_id': new_wbs_id
        })
        changes_log['actions_updated'] += 1
    
    # 4. 更新 Pending Items
    pending = get_pending_items_by_wbs(old_wbs_id)
    for item in pending:
        update_pending_item(item['pending_id'], {
            'related_wbs': new_wbs_id
        })
        changes_log['pending_updated'] += 1
    
    # 5. 更新依賴關係
    deps = get_dependencies_by_wbs(old_wbs_id)
    for dep in deps:
        updates = {}
        if dep['predecessor_id'] == old_wbs_id:
            updates['predecessor_id'] = new_wbs_id
        if dep['successor_id'] == old_wbs_id:
            updates['successor_id'] = new_wbs_id
        
        if updates:
            update_dependency(dep['dependency_id'], updates)
            changes_log['dependencies_updated'] += 1
    
    # 記錄變更日誌
    log_wbs_change(old_wbs_id, new_wbs_id, changes_log)
    
    return changes_log
```

**檢查關聯影響範圍**:
```python
def check_wbs_references(wbs_id):
    """
    檢查 WBS 的所有關聯
    在修改或刪除前使用,讓使用者了解影響範圍
    """
    
    references = {
        'issues': [],
        'action_items': [],
        'pending_items': [],
        'dependencies': [],
        'child_items': []
    }
    
    # 檢查 Issues
    issues = get_issues_by_affected_wbs(wbs_id)
    for issue in issues:
        references['issues'].append({
            'issue_id': issue['issue_id'],
            'issue_number': issue['issue_number'],
            'title': issue['issue_title'],
            'status': issue['status'],
            'severity': issue['severity']
        })
    
    # 檢查 Action Items
    actions = get_action_items_by_wbs(wbs_id)
    for action in actions:
        references['action_items'].append({
            'item_id': action['item_id'],
            'task_name': action['task_name'],
            'status': action['status']
        })
    
    # 檢查 Pending Items
    pending = get_pending_items_by_wbs(wbs_id)
    for item in pending:
        references['pending_items'].append({
            'pending_id': item['pending_id'],
            'description': item['description'],
            'status': item['status']
        })
    
    # 檢查依賴關係
    deps = get_dependencies_by_wbs(wbs_id)
    for dep in deps:
        references['dependencies'].append({
            'dependency_id': dep['dependency_id'],
            'type': dep['dependency_type'],
            'predecessor': dep['predecessor_id'],
            'successor': dep['successor_id']
        })
    
    # 檢查子項目
    children = get_child_wbs_items(wbs_id)
    for child in children:
        references['child_items'].append({
            'wbs_id': child['wbs_id'],
            'task_name': child['task_name']
        })
    
    return references
```

#### 5. 刪除 WBS 項目

**三種刪除策略**:
```python
def delete_wbs_item(wbs_id, strategy='soft', reassign_to=None):
    """
    刪除 WBS 項目
    
    strategy:
    - 'soft': 軟刪除 (標記為已取消,推薦)
    - 'hard': 硬刪除 (真的刪除,需處理所有關聯)
    - 'reassign': 重新分配關聯到其他 WBS
    
    reassign_to: 當 strategy='reassign' 時,指定新的 WBS ID
    """
    
    # 檢查關聯
    refs = check_wbs_references(wbs_id)
    
    # 檢查子項目
    if refs['child_items']:
        return {
            'success': False,
            'error': 'has_children',
            'message': f'此項目有 {len(refs["child_items"])} 個子項目,請先處理',
            'children': refs['child_items']
        }
    
    if strategy == 'soft':
        # 軟刪除: 只更新狀態
        update_wbs_item(wbs_id, {
            'status': '已取消',
            'notes': f'已於 {datetime.now()} 取消'
        })
        
        return {
            'success': True,
            'strategy': 'soft',
            'message': 'WBS 已標記為已取消',
            'references_kept': True
        }
        
    elif strategy == 'hard':
        # 硬刪除: 需要清理所有關聯
        
        # 1. Issues: 從 affected_wbs 中移除此 WBS
        for issue in refs['issues']:
            affected_list = [w.strip() for w in issue['affected_wbs'].split(',')]
            affected_list.remove(wbs_id)
            
            if affected_list:
                update_issue(issue['issue_id'], {
                    'affected_wbs': ','.join(affected_list)
                })
            else:
                # 如果移除後沒有其他 WBS,設為 None
                update_issue(issue['issue_id'], {
                    'affected_wbs': None
                })
        
        # 2. Action Items: 清除關聯
        for action in refs['action_items']:
            update_tracking_item(action['item_id'], {
                'parent_id': None
            })
        
        # 3. Pending Items: 清除關聯
        for pending in refs['pending_items']:
            update_pending_item(pending['pending_id'], {
                'related_wbs': None
            })
        
        # 4. 刪除依賴關係
        for dep in refs['dependencies']:
            delete_dependency(dep['dependency_id'])
        
        # 5. 最後刪除 WBS
        delete_tracking_item(wbs_id)
        
        return {
            'success': True,
            'strategy': 'hard',
            'message': 'WBS 及所有關聯已刪除',
            'cleaned': {
                'issues': len(refs['issues']),
                'actions': len(refs['action_items']),
                'pending': len(refs['pending_items']),
                'dependencies': len(refs['dependencies'])
            }
        }
        
    elif strategy == 'reassign':
        # 重新分配: 將關聯移到其他 WBS
        if not reassign_to:
            return {
                'success': False,
                'error': 'missing_reassign_target',
                'message': '請指定要重新分配的 WBS ID'
            }
        
        # 使用連鎖更新機制
        update_wbs_id_with_cascade(wbs_id, reassign_to)
        
        # 然後刪除原 WBS
        delete_tracking_item(wbs_id)
        
        return {
            'success': True,
            'strategy': 'reassign',
            'message': f'所有關聯已轉移至 {reassign_to}',
            'reassigned_to': reassign_to
        }
```

#### 6. WBS 批次操作

```python
def batch_update_wbs(wbs_ids, updates):
    """
    批次更新多個 WBS 項目
    
    範例:
    batch_update_wbs(
        wbs_ids=['1.1', '1.2', '1.3'],
        updates={'owner_unit': '新團隊', 'priority': 'High'}
    )
    """
    
    results = []
    for wbs_id in wbs_ids:
        try:
            update_wbs_item(wbs_id, updates)
            results.append({'wbs_id': wbs_id, 'success': True})
        except Exception as e:
            results.append({'wbs_id': wbs_id, 'success': False, 'error': str(e)})
    
    return results


def batch_adjust_dates(wbs_ids, shift_days):
    """
    批次調整日期 (整體往後推移 N 天)
    
    範例: batch_adjust_dates(['2.1', '2.2'], shift_days=5)
    """
    
    for wbs_id in wbs_ids:
        item = get_wbs_item(wbs_id)
        
        updates = {}
        if item['original_planned_start']:
            new_start = shift_date(item['original_planned_start'], shift_days)
            updates['original_planned_start'] = new_start
        
        if item['original_planned_end']:
            new_end = shift_date(item['original_planned_end'], shift_days)
            updates['original_planned_end'] = new_end
        
        if updates:
            update_wbs_item(wbs_id, updates)
```

#### 7. 資料一致性檢查

```python
def check_data_consistency(project_id):
    """
    檢查整個專案的資料一致性
    
    檢查項目:
    1. Issues 引用的 WBS 是否存在
    2. Action Items 關聯的 WBS 是否存在
    3. Pending Items 關聯的 WBS 是否存在
    4. Dependencies 的前後置項目是否存在
    5. WBS 階層關係是否正確
    6. WBS 編號是否重複
    """
    
    issues_found = []
    
    # 取得所有有效的 WBS ID
    all_wbs = get_all_wbs_ids(project_id)
    
    # 1. 檢查 Issues
    all_issues = get_all_issues(project_id)
    for issue in all_issues:
        if issue['affected_wbs']:
            wbs_list = [w.strip() for w in issue['affected_wbs'].split(',')]
            for wbs in wbs_list:
                if wbs and wbs not in all_wbs:
                    issues_found.append({
                        'type': 'missing_wbs_in_issue',
                        'severity': 'High',
                        'issue_id': issue['issue_id'],
                        'issue_number': issue['issue_number'],
                        'missing_wbs': wbs,
                        'suggestion': f'Issue {issue["issue_number"]} 引用的 WBS {wbs} 不存在'
                    })
    
    # 2. 檢查 Action Items
    all_actions = get_all_action_items(project_id)
    for action in all_actions:
        if action['parent_id'] and action['parent_id'] not in all_wbs:
            issues_found.append({
                'type': 'missing_wbs_in_action',
                'severity': 'Medium',
                'action_id': action['item_id'],
                'missing_wbs': action['parent_id'],
                'suggestion': f'Action Item {action["item_id"]} 關聯的 WBS {action["parent_id"]} 不存在'
            })
    
    # 3. 檢查 Pending Items
    all_pending = get_all_pending_items(project_id)
    for pending in all_pending:
        if pending['related_wbs'] and pending['related_wbs'] not in all_wbs:
            issues_found.append({
                'type': 'missing_wbs_in_pending',
                'severity': 'Low',
                'pending_id': pending['pending_id'],
                'missing_wbs': pending['related_wbs'],
                'suggestion': f'Pending Item 關聯的 WBS {pending["related_wbs"]} 不存在'
            })
    
    # 4. 檢查 Dependencies
    all_deps = get_all_dependencies(project_id)
    for dep in all_deps:
        if dep['predecessor_id'] not in all_wbs:
            issues_found.append({
                'type': 'broken_dependency',
                'severity': 'High',
                'dependency_id': dep['dependency_id'],
                'missing_wbs': dep['predecessor_id'],
                'suggestion': f'依賴關係的前置項目 {dep["predecessor_id"]} 不存在'
            })
        if dep['successor_id'] not in all_wbs:
            issues_found.append({
                'type': 'broken_dependency',
                'severity': 'High',
                'dependency_id': dep['dependency_id'],
                'missing_wbs': dep['successor_id'],
                'suggestion': f'依賴關係的後續項目 {dep["successor_id"]} 不存在'
            })
    
    # 5. 檢查 WBS 階層關係
    for wbs_id in all_wbs:
        item = get_wbs_item(wbs_id)
        if item['parent_id'] and item['parent_id'] not in all_wbs:
            issues_found.append({
                'type': 'orphan_wbs',
                'severity': 'High',
                'wbs_id': wbs_id,
                'missing_parent': item['parent_id'],
                'suggestion': f'WBS {wbs_id} 的父項目 {item["parent_id"]} 不存在'
            })
    
    # 6. 檢查重複的 WBS 編號
    wbs_count = {}
    for wbs_id in all_wbs:
        wbs_count[wbs_id] = wbs_count.get(wbs_id, 0) + 1
    
    for wbs_id, count in wbs_count.items():
        if count > 1:
            issues_found.append({
                'type': 'duplicate_wbs',
                'severity': 'Critical',
                'wbs_id': wbs_id,
                'count': count,
                'suggestion': f'WBS 編號 {wbs_id} 重複出現 {count} 次'
            })
    
    return {
        'is_consistent': len(issues_found) == 0,
        'total_issues': len(issues_found),
        'by_severity': {
            'Critical': len([i for i in issues_found if i['severity'] == 'Critical']),
            'High': len([i for i in issues_found if i['severity'] == 'High']),
            'Medium': len([i for i in issues_found if i['severity'] == 'Medium']),
            'Low': len([i for i in issues_found if i['severity'] == 'Low'])
        },
        'issues': issues_found
    }
```

#### 8. 自動修復工具

```python
def auto_fix_consistency_issues(project_id, fix_types=['missing_references']):
    """
    自動修復資料一致性問題
    
    fix_types:
    - 'missing_references': 清除不存在的 WBS 引用
    - 'orphan_wbs': 修復孤兒 WBS (清除 parent_id)
    """
    
    consistency_check = check_data_consistency(project_id)
    fixed_count = 0
    
    if 'missing_references' in fix_types:
        # 修復 Issues
        for issue in consistency_check['issues']:
            if issue['type'] == 'missing_wbs_in_issue':
                # 從 affected_wbs 中移除不存在的 WBS
                issue_obj = get_issue(issue['issue_id'])
                wbs_list = [w.strip() for w in issue_obj['affected_wbs'].split(',')]
                wbs_list = [w for w in wbs_list if w in get_all_wbs_ids(project_id)]
                
                update_issue(issue['issue_id'], {
                    'affected_wbs': ','.join(wbs_list) if wbs_list else None
                })
                fixed_count += 1
        
        # 修復 Action Items
        for issue in consistency_check['issues']:
            if issue['type'] == 'missing_wbs_in_action':
                update_tracking_item(issue['action_id'], {
                    'parent_id': None
                })
                fixed_count += 1
    
    if 'orphan_wbs' in fix_types:
        for issue in consistency_check['issues']:
            if issue['type'] == 'orphan_wbs':
                update_wbs_item(issue['wbs_id'], {
                    'parent_id': None
                })
                fixed_count += 1
    
    return {
        'success': True,
        'fixed_count': fixed_count,
        'message': f'已自動修復 {fixed_count} 個問題'
    }
```

#### 9. WBS 管理介面設計

**主檢視**:
```
WBS 管理檢視
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

專案 A - WBS 結構                          [🔍 篩選] [⚙️ 批次操作]

├─ 1.0 需求階段 [80%]                      [✏️編輯] [+子項] [🗑️刪除]
│  ├─ 1.1 需求訪談 [100%] ✓                [✏️] [➕] [🗑️]
│  │                                       ↓ [在此處插入新項目]
│  ├─ 1.2 需求文件 [60%] →                 [✏️] [➕] [🗑️]
│  │  └─ 1.2.1 需求規格 [80%] →            [✏️] [➕] [🗑️]
│  │                                       ↓ [在此處插入新項目]
│  └─ 1.3 需求審核 [0%] ○                  [✏️] [➕] [🗑️]
│
└─ 2.0 設計階段 [20%]                      [✏️] [+子項] [🗑️]
   └─ 2.1 系統設計 [20%] →                 [✏️] [➕] [🗑️]

[+ 新增 WBS 根項目]  [🔍 檢查資料一致性]

圖示說明: ✓ 已完成  → 進行中  ○ 未開始
```

#### 10. WBS 自動計算功能

**工作天數自動計算**:
```python
def calculate_work_days(start_date, end_date, exclude_weekends=True, exclude_holidays=None):
    """
    自動計算工作天數
    
    參數:
        start_date: 開始日期
        end_date: 結束日期
        exclude_weekends: 是否排除週末 (預設 True)
        exclude_holidays: 假日列表 (可選)
    
    返回:
        工作天數 (整數)
    
    範例:
        calculate_work_days('11/27/2024', '12/05/2024')
        # 11/27 (三) ~ 12/05 (四)
        # 排除週末: 11/30, 12/01
        # 實際工作日: 7 天
    """
    
    if not start_date or not end_date:
        return None
    
    start = parse_date(start_date)
    end = parse_date(end_date)
    
    if start > end:
        return 0
    
    work_days = 0
    current = start
    
    while current <= end:
        # 檢查是否為週末
        is_weekend = exclude_weekends and current.weekday() >= 5  # 5=六, 6=日
        
        # 檢查是否為假日
        is_holiday = False
        if exclude_holidays:
            date_str = current.strftime('%Y-%m-%d')
            is_holiday = date_str in exclude_holidays
        
        if not is_weekend and not is_holiday:
            work_days += 1
        
        current += timedelta(days=1)
    
    return work_days


def auto_calculate_work_days(item_id):
    """
    自動計算並更新 WBS 項目的工作天數
    
    使用優先順序:
    1. 如果有「調整日期」→ 使用調整日期計算
    2. 否則使用「原始計畫日期」計算
    """
    
    item = get_wbs_item(item_id)
    
    # 決定使用哪組日期
    start_date = item['revised_planned_start'] or item['original_planned_start']
    end_date = item['revised_planned_end'] or item['original_planned_end']
    
    if start_date and end_date:
        work_days = calculate_work_days(start_date, end_date)
        
        # 更新到資料庫
        update_wbs_item(item_id, {'work_days': work_days})
        
        return work_days
    
    return None
```

**預估完成進度自動計算**:
```python
def calculate_estimated_progress(start_date, end_date, actual_start=None):
    """
    根據時程自動計算預估完成進度
    
    計算邏輯:
    1. 如果今天在開始日期之前 → 0%
    2. 如果今天在結束日期之後 → 100%
    3. 如果今天在期間內 → 按比例計算
    
    範例:
        計畫: 11/01 ~ 11/10 (10天)
        今天: 11/05 (已過 4天)
        預估進度: 40%
    """
    
    if not start_date or not end_date:
        return 0
    
    today = datetime.now().date()
    start = parse_date(start_date)
    end = parse_date(end_date)
    
    # 情況 1: 尚未開始
    if today < start:
        return 0
    
    # 情況 2: 已超過結束日期
    if today > end:
        return 100
    
    # 情況 3: 進行中,按時間比例計算
    total_days = (end - start).days + 1
    elapsed_days = (today - start).days + 1
    
    if total_days > 0:
        progress = int((elapsed_days / total_days) * 100)
        return min(progress, 100)  # 確保不超過 100%
    
    return 0


def auto_calculate_estimated_progress(item_id):
    """
    自動計算並更新預估完成進度
    
    使用優先順序:
    1. 如果有「調整日期」→ 使用調整日期
    2. 否則使用「原始計畫日期」
    3. 如果有「實際開始日期」→ 從實際開始算起
    """
    
    item = get_wbs_item(item_id)
    
    # 決定使用哪組日期
    start_date = item['revised_planned_start'] or item['original_planned_start']
    end_date = item['revised_planned_end'] or item['original_planned_end']
    actual_start = item['actual_start_date']
    
    if start_date and end_date:
        # 如果有實際開始日期,優先使用
        if actual_start:
            estimated = calculate_estimated_progress(actual_start, end_date)
        else:
            estimated = calculate_estimated_progress(start_date, end_date)
        
        # 計算進度偏差
        actual = item['actual_progress'] or 0
        variance = actual - estimated
        
        # 更新到資料庫
        update_wbs_item(item_id, {
            'estimated_progress': estimated,
            'progress_variance': variance
        })
        
        return {
            'estimated_progress': estimated,
            'actual_progress': actual,
            'progress_variance': variance
        }
    
    return None
```

**自動更新機制設計**:
```python
class WBSAutoCalculator:
    """
    WBS 自動計算管理器
    負責觸發各種自動計算
    """
    
    def __init__(self, db_path):
        self.db_path = db_path
    
    def on_dates_changed(self, item_id, old_dates, new_dates):
        """
        當日期欄位變更時自動觸發計算
        
        變更時機:
        - original_planned_start/end 變更
        - revised_planned_start/end 變更
        - actual_start_date 變更
        """
        
        # 1. 重新計算工作天數
        work_days = auto_calculate_work_days(item_id)
        
        # 2. 重新計算預估進度
        progress_info = auto_calculate_estimated_progress(item_id)
        
        # 3. 檢查是否影響依賴項目
        self._check_dependency_impact(item_id, new_dates)
        
        return {
            'work_days': work_days,
            'progress_info': progress_info
        }
    
    def on_progress_changed(self, item_id, new_progress):
        """
        當實際進度變更時重新計算進度偏差
        """
        
        progress_info = auto_calculate_estimated_progress(item_id)
        
        # 檢查是否需要預警
        if progress_info['progress_variance'] < -20:
            self._send_progress_alert(item_id, progress_info)
        
        return progress_info
    
    def batch_recalculate_all(self, project_id):
        """
        批次重新計算整個專案的所有 WBS
        
        使用時機:
        - 專案初始化後
        - 大量匯入 WBS 後
        - 定期維護 (每日自動執行)
        """
        
        all_items = get_all_wbs_items(project_id)
        
        results = {
            'total': len(all_items),
            'updated': 0,
            'skipped': 0,
            'errors': []
        }
        
        for item in all_items:
            try:
                # 計算工作天數
                auto_calculate_work_days(item['item_id'])
                
                # 計算預估進度
                auto_calculate_estimated_progress(item['item_id'])
                
                results['updated'] += 1
                
            except Exception as e:
                results['errors'].append({
                    'item_id': item['item_id'],
                    'error': str(e)
                })
                results['skipped'] += 1
        
        return results
    
    def calculate_parent_progress(self, parent_id):
        """
        根據子項目自動計算父項目的進度
        
        計算方式:
        - 父項目進度 = 所有子項目進度的加權平均
        - 權重 = 子項目的工作天數
        """
        
        children = get_child_wbs_items(parent_id)
        
        if not children:
            return None
        
        total_weight = 0
        weighted_progress = 0
        
        for child in children:
            weight = child['work_days'] or 1  # 預設權重 1
            progress = child['actual_progress'] or 0
            
            total_weight += weight
            weighted_progress += (progress * weight)
        
        if total_weight > 0:
            parent_progress = int(weighted_progress / total_weight)
            
            # 更新父項目進度
            update_wbs_item(parent_id, {
                'actual_progress': parent_progress
            })
            
            return parent_progress
        
        return None
    
    def _check_dependency_impact(self, item_id, new_dates):
        """
        檢查日期變更對依賴項目的影響
        """
        
        # 找出依賴此項目的後續項目
        dependents = get_dependent_items(item_id)
        
        for dep in dependents:
            # 根據依賴類型調整後續項目的日期
            if dep['dependency_type'] == 'FS':  # Finish-to-Start
                # 前置項目結束日期 + lag → 後續項目開始日期
                suggested_start = calculate_successor_start(
                    predecessor_end=new_dates['end'],
                    lag_days=dep['lag_days']
                )
                
                # 提醒使用者可能需要調整
                log_dependency_alert(dep['successor_id'], suggested_start)
    
    def _send_progress_alert(self, item_id, progress_info):
        """
        發送進度異常警示
        """
        
        item = get_wbs_item(item_id)
        
        alert_message = f"""
        ⚠️ 進度異常警示
        
        WBS: {item['wbs_id']} - {item['task_name']}
        實際進度: {progress_info['actual_progress']}%
        預估進度: {progress_info['estimated_progress']}%
        進度偏差: {progress_info['progress_variance']}%
        
        建議: 請檢查任務執行狀況
        """
        
        # 記錄到系統日誌
        log_alert(item_id, alert_message)
```

**Excel 匯入時自動計算**:
```python
def import_from_excel_with_auto_calc(excel_file, project_id):
    """
    從 Excel 匯入並自動計算
    """
    
    # 先執行正常匯入
    importer = ProjectTrackingImporter(db_path)
    imported_count = importer.import_from_excel(excel_file, project_id)
    
    # 匯入完成後批次計算
    calculator = WBSAutoCalculator(db_path)
    calc_results = calculator.batch_recalculate_all(project_id)
    
    print(f"✓ 匯入 {imported_count} 筆資料")
    print(f"✓ 自動計算 {calc_results['updated']} 個項目")
    
    if calc_results['errors']:
        print(f"⚠️ {len(calc_results['errors'])} 個項目計算失敗")
    
    return {
        'imported': imported_count,
        'calculated': calc_results
    }
```

**介面顯示**:
```
WBS 項目詳情
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WBS: 1.2 - 需求文件撰寫

📅 時程資訊:
   原始計畫: 11/01 ~ 11/10  (工作天數: 8天) 🤖 自動計算
   調整計畫: 11/03 ~ 11/15  (工作天數: 11天) 🤖 自動計算
   實際執行: 11/03 ~ 進行中

📊 進度資訊:
   實際進度: 60% ✏️ 手動輸入
   預估進度: 75% 🤖 自動計算 (基於今天 11/27)
   進度偏差: -15% 🤖 自動計算
   
   ⚠️ 提醒: 進度落後預期 15%

[更新進度]  [調整日期]  [🔄 重新計算]

註: 🤖 標示表示系統自動計算,日期或進度變更時會自動更新
```

**定期自動計算排程**:
```python
# 每日自動執行 (建議在凌晨)
def daily_auto_calculation_job():
    """
    每日自動計算任務
    
    執行項目:
    1. 重新計算所有項目的預估進度
    2. 更新進度偏差
    3. 檢查並發送進度異常警示
    4. 更新父項目進度
    """
    
    projects = get_all_active_projects()
    
    for project in projects:
        calculator = WBSAutoCalculator(db_path)
        
        # 批次重新計算
        results = calculator.batch_recalculate_all(project['project_id'])
        
        # 計算所有父項目進度
        parent_items = get_parent_items(project['project_id'])
        for parent in parent_items:
            calculator.calculate_parent_progress(parent['item_id'])
        
        # 記錄執行日誌
        log_daily_calculation(project['project_id'], results)

# 設定排程 (使用 cron 或 Windows Task Scheduler)
# 每天凌晨 2:00 執行
# 0 2 * * * python daily_auto_calculation.py
```

**手動觸發重新計算**:
```python
def recalculate_wbs_item(item_id):
    """
    手動觸發單一 WBS 項目的重新計算
    
    使用時機:
    - 使用者修改日期後
    - 使用者修改進度後
    - 使用者點擊「重新計算」按鈕
    """
    
    calculator = WBSAutoCalculator(db_path)
    
    # 計算工作天數
    work_days = auto_calculate_work_days(item_id)
    
    # 計算預估進度
    progress_info = auto_calculate_estimated_progress(item_id)
    
    # 如果是父項目,重新計算基於子項目的進度
    if has_children(item_id):
        parent_progress = calculator.calculate_parent_progress(item_id)
        progress_info['parent_calculated_progress'] = parent_progress
    
    return {
        'work_days': work_days,
        'progress': progress_info,
        'timestamp': datetime.now()
    }
```

**計算觸發時機總結**:
```
自動觸發計算的時機:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 日期欄位變更時:
   ├─ 重新計算工作天數
   ├─ 重新計算預估進度
   └─ 重新計算進度偏差

2. 實際進度變更時:
   ├─ 重新計算進度偏差
   └─ 檢查是否需要警示

3. Excel 匯入後:
   └─ 批次計算所有項目

4. 每日定期任務 (凌晨 2:00):
   ├─ 重新計算所有預估進度
   ├─ 更新所有進度偏差
   └─ 計算父項目進度

5. 使用者手動觸發:
   └─ 點擊「重新計算」按鈕

6. 子項目進度變更時:
   └─ 自動更新父項目進度
```

---

## 待辦清單管理功能

### 功能設計
```
修改 WBS 編號
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

任務: 1.2 需求文件撰寫
原編號: 1.2
新編號: [1.3___]

⚠️ 影響範圍檢查:
   此 WBS 被以下項目引用:
   
   📋 Issues (2 項):
      ├─ ISS-001: 客戶環境問題 (Open)
      └─ ISS-003: 需求不明確 (In Progress)
   
   📌 Action Items (3 項):
      ├─ ACT-005: 更新文件
      ├─ ACT-007: 測試確認
      └─ ACT-009: 客戶審核
   
   ⏳ Pending Items (1 項):
      └─ 等待客戶確認需求
   
   🔗 Dependencies (2 項):
      ├─ 1.1 → 1.2 (FS)
      └─ 1.2 → 2.1 (FS)
   
   👶 子項目 (1 項):
      └─ 1.2.1 需求規格

更新策略:
  (●) 自動更新所有關聯項目 (推薦)
      系統會自動更新上述所有引用此 WBS 的項目
      
  ( ) 僅更新 WBS 編號,不更新關聯 (不推薦)
      ⚠️ 警告: 會造成資料不一致

預計更新項目數: 9 項 (2 Issues + 3 Actions + 1 Pending + 2 Deps + 1 Child)

[取消]  [確認修改]
```

**刪除 WBS 介面**:
```
刪除 WBS 項目
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

確定要刪除: 1.2 需求文件撰寫?

⚠️ 此項目有以下關聯:
   - Issues: 2 項
   - Action Items: 3 項
   - Pending Items: 1 項
   - Dependencies: 2 項
   - 子項目: 1 項 ⚠️ 請先處理子項目

刪除策略:
  (●) 軟刪除 (推薦)
      標記為「已取消」,保留所有關聯資料
      可在報告中篩選排除已取消項目
      
  ( ) 硬刪除
      完全刪除此 WBS 及清除所有關聯
      ⚠️ 此操作無法復原
      
  ( ) 重新分配
      將所有關聯轉移到其他 WBS
      新 WBS: [_______]

[取消]  [確認刪除]
```

**中間插入介面**:
```
在 WBS 項目之間插入
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

位置: 在 1.1 和 1.2 之間

插入策略:
  (●) 使用子編號 (推薦)
      新建 WBS: 1.1.5
      優點: 不影響現有編號
      
  ( )

#### 1. 待辦清單檢視

**列表視圖**:
```
待處理事項 (5 項)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 11/28 | 客戶 | 王小明 (wang@client.com)
   等待客戶確認需求變更
   預期回覆: 11/30 | 狀態: 待處理 | 優先: High
   關聯: WBS 2.1

📅 11/27 | 內部 | IT部門 - 李工程師
   環境設定問題處理
   預期回覆: 11/29 | 狀態: 處理中 | 優先: Medium
   
📅 11/25 | 自己 | 備忘
   更新專案時程表
   預期回覆: 11/27 | 狀態: 逾期 ⚠️ | 優先: High
```

**日曆視圖**:
```
本週待辦 (11/25 - 12/01)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
週一 11/25: 2 項
  ├─ [客戶] 需求確認 (逾期) 🔴
  └─ [自己] 更新時程 (逾期) 🔴

週三 11/27: 1 項
  └─ [內部] 環境設定

週五 11/29: 3 項
  ├─ [客戶] 規格審核
  ├─ [內部] 測試報告
  └─ [自己] 週報準備
```

#### 2. 待辦清單操作

**新增待辦事項**:
```python
def add_pending_item(project_id, item_data):
    """
    新增待辦清單項目
    
    item_data 範例:
    {
        'task_date': '11/27/2024',
        'source_type': '客戶',
        'contact_info': '王小明 (wang@client.com, 0912-345-678)',
        'description': '確認需求變更內容',
        'expected_reply_date': '11/30/2024',
        'priority': 'High',
        'related_wbs': '2.1'
    }
    """
```

**更新回覆狀態**:
```python
def mark_as_replied(pending_id, reply_info):
    """
    標記為已回覆
    
    reply_info:
    {
        'actual_reply_date': '11/28/2024',
        'handling_notes': '已電話確認,客戶同意變更'
    }
    """
```

#### 3. 待辦清單報告

**每日待辦清單**:
```
今日待辦事項 (2024-11-27)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 逾期項目 (2 項)
  ├─ [客戶] 需求確認 (逾期 2 天)
  └─ [自己] 時程更新 (逾期 1 天)

📋 今日到期 (3 項)
  ├─ [內部] 環境設定確認
  ├─ [客戶] 測試環境準備
  └─ [自己] 週報準備

📅 本週即將到期 (5 項)
  ...
```

**回覆效率統計**:
```
待辦清單統計 (本月)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
總項目數: 25 項
  ├─ 已完成: 18 項 (72%)
  ├─ 處理中: 5 項 (20%)
  └─ 待處理: 2 項 (8%)

平均回覆時間:
  ├─ 客戶來源: 2.5 天
  ├─ 內部來源: 1.2 天
  └─ 自己備忘: 0.8 天

準時回覆率: 85% (17/20)
```

#### 4. 與其他功能整合

**自動建立 Action Item**:
```python
# 當待辦事項建立時,可選擇同時建立 Action Item
if create_action_item:
    action_data = {
        'task_name': pending_item['description'],
        'owner_unit': pending_item['source_type'],
        'due_date': pending_item['expected_reply_date'],
        'related_wbs': pending_item['related_wbs']
    }
    add_action_item(project_id, action_data)
```

**🆕 轉換為問題追蹤**:
```python
def convert_pending_to_issue(pending_id):
    """
    將待辦事項轉換為問題追蹤
    適用情境:
    - 待辦事項逾期超過 3 天
    - 待辦事項需要正式的問題管理流程
    - 待辦事項涉及重大影響
    """
    pending = get_pending_item(pending_id)
    
    issue_data = {
        'issue_title': pending['description'],
        'issue_description': f"來自待辦事項: {pending['description']}\n連絡人: {pending['contact_info']}",
        'issue_type': '其他',  # 可手動調整
        'severity': 'Medium' if pending['priority'] == 'High' else 'Low',
        'reported_by': pending['source_type'],
        'reported_date': pending['task_date'],
        'owner_type': pending['source_type'],
        'affected_wbs': pending['related_wbs'],
        'source': 'Pending Item',
        'source_reference_id': pending_id
    }
    
    # 建立問題追蹤
    issue_id = create_issue(project_id, issue_data)
    
    # 更新待辦事項,關聯到問題追蹤
    update_pending_item(pending_id, {'related_issue_id': issue_id})
    
    return issue_id
```

**與行事曆同步** (未來擴充):
```python
# 匯出到 Google Calendar / Outlook
export_to_calendar(pending_items, calendar_type='google')
```

---

## 問題管理追蹤功能

### 功能設計

#### 1. 問題追蹤檢視

**問題清單視圖**:
```
開放問題 (5 項)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISS-001 | Critical | 客戶環境無法連線
   回報: 11/25 王工程師 | 負責: IT部門
   影響: WBS 2.1, 2.2 | 預估影響: 5 天
   狀態: In Progress | 目標解決: 11/28
   
🟠 ISS-002 | High | 需求規格不明確
   回報: 11/26 客戶 | 負責: BA Team
   影響: WBS 1.2 | 預估影響: 3 天
   狀態: Pending | 等待客戶回覆
   
🟡 ISS-003 | Medium | 測試資料準備延遲
   回報: 11/27 QA Team | 負責: 開發部
   影響: WBS 3.1 | 預估影響: 2 天
   狀態: Open | 目標解決: 11/30
```

**問題分類矩陣視圖**:
```
嚴重程度 vs 優先級矩陣
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           Urgent    High      Medium    Low
Critical   [2]       [1]       [ ]       [ ]
High       [1]       [3]       [2]       [ ]
Medium     [ ]       [1]       [4]       [1]
Low        [ ]       [ ]       [2]       [3]

🔴 需立即處理: 3 項
🟠 本週處理: 5 項
🟡 本月處理: 8 項
```

**問題趨勢圖**:
```
本月問題趨勢
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
新增問題: ████████░░ 8 項
解決問題: ██████░░░░ 6 項
開放問題: ███░░░░░░░ 3 項

平均解決時間: 4.5 天
解決率: 75% (6/8)
```

#### 2. 問題生命週期管理

**狀態流轉**:
```
Open (開放)
  ↓ 分派責任人
In Progress (處理中)
  ↓ 提出解決方案
Pending (等待中) ←→ 等待外部輸入/決策
  ↓ 方案實施完成
Resolved (已解決)
  ↓ 確認有效
Closed (已關閉)

特殊狀態:
Cancelled (已取消) ← 不需要處理
```

**問題升級機制**:
```
自動升級觸發條件:
1. Critical 問題超過 1 天未處理 → 升級至 Senior Manager
2. High 問題超過 3 天未處理 → 升級至 PM
3. 任何問題超過目標日期 → 升級至 PM
4. 影響天數 > 5 天 → 升級至 Executive

手動升級:
- PM 可主動升級重大問題
- 記錄升級原因與時間
```

#### 3. 問題追蹤操作

**建立問題**:
```python
def create_issue(project_id, issue_data):
    """
    建立問題追蹤
    
    issue_data 範例:
    {
        'issue_title': '客戶環境連線問題',
        'issue_description': '客戶 VPN 環境無法連線到測試伺服器',
        'issue_type': '技術問題',
        'issue_category': '阻礙者',
        'severity': 'Critical',
        'priority': 'Urgent',
        'reported_by': '王工程師',
        'assigned_to': 'IT部門',
        'owner_type': '內部',
        'affected_wbs': '2.1,2.2',
        'impact_description': '無法進行系統測試',
        'estimated_impact_days': 5,
        'target_resolution_date': '11/28/2024'
    }
    """
    
    # 自動生成問題編號
    issue_number = generate_issue_number(project_id)  # ISS-001, ISS-002...
    
    # 檢查是否需要自動升級
    if issue_data['severity'] == 'Critical':
        issue_data['is_escalated'] = True
        issue_data['escalation_level'] = 'Senior Manager'
        issue_data['escalation_date'] = datetime.now()
        issue_data['escalation_reason'] = 'Critical 問題自動升級'
    
    # 插入資料庫
    issue_id = insert_issue(project_id, issue_number, issue_data)
    
    # 記錄初始狀態
    log_status_change(issue_id, None, 'Open', '問題建立')
    
    # 發送通知
    notify_issue_created(issue_id)
    
    return issue_id
```

**更新問題狀態**:
```python
def update_issue_status(issue_id, new_status, notes, changed_by):
    """
    更新問題狀態
    
    自動記錄狀態變更歷史
    """
    old_status = get_current_status(issue_id)
    
    # 更新狀態
    update_issue(issue_id, {'status': new_status})
    
    # 記錄歷史
    log_status_change(
        issue_id=issue_id,
        old_status=old_status,
        new_status=new_status,
        changed_by=changed_by,
        notes=notes
    )
    
    # 特殊狀態處理
    if new_status == 'Resolved':
        update_issue(issue_id, {
            'actual_resolution_date': datetime.now()
        })
    elif new_status == 'Closed':
        update_issue(issue_id, {
            'closed_date': datetime.now()
        })
```

**新增溝通記錄**:
```python
def add_communication_log(issue_id, log_entry):
    """
    新增溝通記錄
    
    log_entry:
    {
        'date': '11/27/2024 14:30',
        'type': 'Email' / 'Phone' / 'Meeting' / 'System',
        'from': '王工程師',
        'to': '客戶',
        'summary': '確認客戶網路設定',
        'details': '客戶防火牆規則需要調整...'
    }
    """
    issue = get_issue(issue_id)
    comm_log = json.loads(issue['communication_log'] or '[]')
    comm_log.append(log_entry)
    
    update_issue(issue_id, {
        'communication_log': json.dumps(comm_log, ensure_ascii=False)
    })
```

#### 4. 問題分析與報告

**問題統計儀表板**:
```python
def get_issue_statistics(project_id, period='month'):
    """
    問題統計分析
    
    返回:
    {
        'total_issues': 15,
        'open_issues': 3,
        'in_progress': 5,
        'resolved': 6,
        'closed': 1,
        
        'by_severity': {
            'Critical': 2,
            'High': 5,
            'Medium': 6,
            'Low': 2
        },
        
        'by_type': {
            '技術問題': 8,
            '需求問題': 4,
            '時程問題': 3
        },
        
        'avg_resolution_days': 4.5,
        'resolution_rate': 0.75,
        
        'escalated_issues': 2,
        'overdue_issues': 1
    }
    """
```

**問題趨勢報告**:
```
本月問題分析報告
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 整體統計:
   總問題數: 15 項
   ├─ 已關閉: 7 項 (47%)
   ├─ 進行中: 5 項 (33%)
   └─ 待處理: 3 項 (20%)

⏱️ 處理效率:
   平均解決時間: 4.5 天
   準時解決率: 80% (4/5)
   
🔥 高風險問題:
   1. ISS-001 客戶環境問題 (Critical, 已逾期 2 天)
   2. ISS-003 需求不明確 (High, 已升級)

📈 趨勢分析:
   本月新增: 8 項 (↑ 比上月 +2)
   本月解決: 6 項 (↓ 比上月 -1)
   技術問題占比增加: 53% (上月 40%)

💡 建議行動:
   - 加強前期需求確認,減少需求問題
   - 客戶相關問題建議建立快速響應機制
```

#### 5. 從待辦事項建立問題

**介面設計**:
```
待辦事項詳情
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 客戶確認需求變更
   日期: 11/25
   來源: 客戶 (王小明, wang@client.com)
   預期回覆: 11/27
   狀態: 逾期 2 天 ⚠️
   
處理說明:
   已發送 3 次 Email,客戶未回覆
   
關聯: WBS 2.1

[標記已回覆]  [取消]  [🆕 轉為問題追蹤]
```

**轉換流程**:
```
使用者點擊「轉為問題追蹤」
   ↓
自動帶入資訊:
- 問題標題: 待辦事項描述
- 問題描述: 自動組合待辦資訊
- 回報人: 待辦來源
- 受影響 WBS: 關聯的 WBS
   ↓
使用者補充資訊:
- 問題類型
- 嚴重程度
- 負責人
- 目標解決日期
   ↓
建立問題追蹤 (狀態: Open)
   ↓
待辦事項狀態更新為「已轉問題追蹤」
關聯 related_issue_id
```

**自動轉換觸發** (選用):
```python
def auto_convert_overdue_pending():
    """
    自動將逾期超過 3 天的待辦事項轉為問題追蹤
    """
    overdue_items = get_overdue_pending_items(days=3)
    
    for item in overdue_items:
        if not item['related_issue_id']:  # 尚未轉換
            issue_id = convert_pending_to_issue(item['pending_id'])
            
            # 發送通知
            notify_pending_converted_to_issue(item, issue_id)
```

#### 6. 問題與 WBS 的 Impact 整合

```python
def analyze_issue_impact(issue_id):
    """
    分析問題對 WBS 的影響
    
    整合依賴關係分析
    """
    issue = get_issue(issue_id)
    affected_wbs = issue['affected_wbs'].split(',')
    impact_days = issue['estimated_impact_days']
    
    impact_report = {
        'direct_impact': [],
        'cascade_impact': [],
        'critical_path_affected': False
    }
    
    for wbs_id in affected_wbs:
        # 檢查此 WBS 的依賴關係
        dependents = get_dependent_items(wbs_id)
        
        for dep in dependents:
            impact_report['cascade_impact'].append({
                'wbs_id': dep['wbs_id'],
                'task_name': dep['task_name'],
                'estimated_delay': impact_days
            })
        
        # 檢查是否在關鍵路徑上
        if is_on_critical_path(wbs_id):
            impact_report['critical_path_affected'] = True
    
    return impact_report
```

---

## 資料模型設計

### 1. 核心資料表: tracking_items

```sql
CREATE TABLE tracking_items (
    -- 唯一識別
    item_id TEXT PRIMARY KEY,              -- 格式: {project_id}_{wbs_id} 或 {project_id}_ACT_{n}
    project_id TEXT,                       -- 專案 ID
    
    -- WBS 結構
    wbs_id TEXT,                           -- WBS 編號 (1, 2, 2.1, 2.2)
    parent_id TEXT,                        -- 父項目 ID (2.1 的 parent 是 2)
    task_name TEXT,                        -- 任務說明
    item_type TEXT,                        -- 'WBS' / 'Action Item' / 'Issue'
    category TEXT,                         -- 'Milestone' / 'Task'
    
    -- 責任單位
    owner_unit TEXT,                       -- 原始單位欄位 (例如: AAA/BBB, 客戶)
    owner_type TEXT,                       -- 'Client' / 'Internal' / 'Department'
    primary_owner TEXT,                    -- 主要負責人/單位
    secondary_owner TEXT,                  -- 協作單位 (如果有 /)
    
    -- 時程管理 (三階段)
    -- 階段 1: 原始規劃 (Baseline)
    original_planned_start DATE,           -- 原始計畫開始 (mm/dd/yyyy)
    original_planned_end DATE,             -- 原始計畫結束
    
    -- 階段 2: 規劃調整 (Revised)
    revised_planned_start DATE,            -- 調整後開始日期
    revised_planned_end DATE,              -- 調整後結束日期
    
    -- 階段 3: 實際執行 (Actual)
    actual_start_date DATE,                -- 實際開始日期
    actual_end_date DATE,                  -- 實際結束日期
    work_days INTEGER,                     -- 工作天數
    
    -- 進度追蹤
    actual_progress INTEGER,               -- 實際完成進度 (0-100%)
    estimated_progress INTEGER,            -- 預估完成進度 (系統自動計算)
    progress_variance INTEGER,             -- 進度偏差 (實際 - 預估)
    
    -- 狀態管理
    status TEXT,                           -- '未開始' / '進行中' / '已完成'
    is_overdue BOOLEAN,                    -- 是否已過期 (獨立標示欄位)
    
    -- 備註與提醒
    notes TEXT,                            -- 備註說明
    alert_flag TEXT,                       -- 警示標記 (⚠️)
    
    -- 來源追蹤
    source TEXT,                           -- 'WBS Import' / 'Meeting Action' / 'Manual'
    source_date DATE,                      -- 建立日期
    source_reference TEXT,                 -- 來源參考 (會議編號等)
    
    -- 系統欄位
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. 依賴關係表: item_dependencies

```sql
CREATE TABLE item_dependencies (
    dependency_id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 依賴關係
    predecessor_id TEXT,                   -- 前置項目 (被依賴的)
    successor_id TEXT,                     -- 後續項目 (依賴別人的)
    
    -- 依賴類型
    dependency_type TEXT,                  -- 'FS' / 'SS' / 'FF' / 'SF'
    /*
        FS (Finish-to-Start): A 完成才能開始 B
        SS (Start-to-Start): A 開始才能開始 B
        FF (Finish-to-Finish): A 完成才能完成 B
        SF (Start-to-Finish): A 開始才能完成 B
    */
    
    lag_days INTEGER DEFAULT 0,            -- 延遲/提前天數 (正數=延遲, 負數=提前)
    
    -- Impact 評估
    impact_level TEXT,                     -- 'Critical' / 'High' / 'Medium' / 'Low'
    impact_description TEXT,               -- 影響範圍描述
    
    -- 狀態
    is_active BOOLEAN DEFAULT 1,           -- 是否啟用此依賴關係
    
    -- 系統欄位
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (predecessor_id) REFERENCES tracking_items(item_id),
    FOREIGN KEY (successor_id) REFERENCES tracking_items(item_id)
);
```

### 3. 時程變更歷史表: schedule_changes

```sql
CREATE TABLE schedule_changes (
    change_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id TEXT,
    
    -- 變更資訊
    change_date TIMESTAMP,                 -- 變更時間
    change_by TEXT,                        -- 變更人
    change_type TEXT,                      -- 'Start Date' / 'End Date' / 'Both'
    change_reason TEXT,                    -- 變更原因
    
    -- 變更前後對比
    old_start_date DATE,
    old_end_date DATE,
    new_start_date DATE,
    new_end_date DATE,
    
    -- 影響分析
    affected_items_count INTEGER,          -- 受影響項目數量
    affected_items TEXT,                   -- 受影響項目清單 (JSON)
    impact_summary TEXT,                   -- 影響摘要
    
    FOREIGN KEY (item_id) REFERENCES tracking_items(item_id)
);
```

### 4. 待辦清單管理表: pending_items

```sql
CREATE TABLE pending_items (
    pending_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT,
    
    -- 基本資訊
    task_date DATE,                        -- 日期
    source_type TEXT,                      -- 來源: '客戶' / '自己' / '內部'
    contact_info TEXT,                     -- 連絡資訊 (姓名、Email、電話等)
    description TEXT,                      -- 待辦事項描述
    
    -- 時程追蹤
    expected_reply_date DATE,              -- 預期回覆日期
    is_replied BOOLEAN DEFAULT 0,          -- 是否已回覆
    actual_reply_date DATE,                -- 實際回覆日期
    
    -- 處理資訊
    handling_notes TEXT,                   -- 處理說明
    
    -- 關聯資訊
    related_wbs TEXT,                      -- 關聯的 WBS 項目 (可選)
    related_action_item TEXT,              -- 關聯的 Action Item (可選)
    related_issue_id INTEGER,              -- 🆕 關聯的問題追蹤 ID
    
    -- 狀態與優先級
    status TEXT DEFAULT '待處理',          -- '待處理' / '處理中' / '已完成' / '已取消'
    priority TEXT,                         -- 'High' / 'Medium' / 'Low'
    
    -- 系統欄位
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (related_issue_id) REFERENCES issue_tracking(issue_id)
);
```

### 5. 問題管理追蹤表: issue_tracking

```sql
CREATE TABLE issue_tracking (
    issue_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT,
    
    -- 問題識別
    issue_number TEXT,                     -- 問題編號 (例如: ISS-001)
    issue_title TEXT NOT NULL,             -- 問題標題
    issue_description TEXT,                -- 問題描述
    
    -- 分類
    issue_type TEXT,                       -- '技術問題' / '需求問題' / '資源問題' / '時程問題' / '其他'
    issue_category TEXT,                   -- '阻礙者' / '風險' / '變更請求' / '缺陷'
    
    -- 嚴重程度與優先級
    severity TEXT,                         -- 'Critical' / 'High' / 'Medium' / 'Low'
    priority TEXT,                         -- 'Urgent' / 'High' / 'Medium' / 'Low'
    
    -- 責任歸屬
    reported_by TEXT,                      -- 回報人
    reported_date DATE,                    -- 回報日期
    assigned_to TEXT,                      -- 負責人
    owner_type TEXT,                       -- '客戶' / '內部' / '廠商'
    
    -- 影響範圍
    affected_wbs TEXT,                     -- 受影響的 WBS 項目 (可多個,逗號分隔)
    impact_description TEXT,               -- 影響說明
    estimated_impact_days INTEGER,         -- 預估影響天數
    
    -- 狀態追蹤
    status TEXT DEFAULT 'Open',            -- 'Open' / 'In Progress' / 'Pending' / 'Resolved' / 'Closed' / 'Cancelled'
    resolution TEXT,                       -- 解決方案
    root_cause TEXT,                       -- 根本原因分析
    
    -- 時程
    target_resolution_date DATE,           -- 目標解決日期
    actual_resolution_date DATE,           -- 實際解決日期
    closed_date DATE,                      -- 關閉日期
    
    -- 升級與追蹤
    is_escalated BOOLEAN DEFAULT 0,        -- 是否已升級
    escalation_level TEXT,                 -- 升級層級: 'PM' / 'Senior Manager' / 'Executive'
    escalation_date DATE,                  -- 升級日期
    escalation_reason TEXT,                -- 升級原因
    
    -- 溝通記錄
    communication_log TEXT,                -- 溝通記錄 (JSON 格式)
    
    -- 來源追蹤
    source TEXT,                           -- 'Pending Item' / 'Meeting' / 'Manual' / 'Customer Report'
    source_reference_id INTEGER,           -- 來源參考 ID (例如: pending_id)
    
    -- 附件與參考
    attachments TEXT,                      -- 附件路徑 (JSON 格式)
    related_issues TEXT,                   -- 相關問題 ID (逗號分隔)
    
    -- 系統欄位
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);
```

### 6. 問題狀態變更歷史表: issue_status_history

```sql
CREATE TABLE issue_status_history (
    history_id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_id INTEGER,
    
    -- 狀態變更
    old_status TEXT,
    new_status TEXT,
    change_date TIMESTAMP,
    changed_by TEXT,
    change_reason TEXT,
    
    -- 欄位變更 (可選)
    field_name TEXT,                       -- 變更的欄位名稱
    old_value TEXT,                        -- 舊值
    new_value TEXT,                        -- 新值
    
    notes TEXT,                            -- 變更備註
    
    FOREIGN KEY (issue_id) REFERENCES issue_tracking(issue_id)
);
```

---

## Excel 匯入格式規格

### WBS 項目匯入格式

| 欄位名稱 | 資料類型 | 說明 | 範例 |
|---------|---------|------|------|
| 項目 | TEXT | WBS ID | 1, 2, 2.1, 2.2 |
| 任務說明 | TEXT | 任務名稱 | 需求訪談 |
| 單位 | TEXT | 負責單位 | AAA/BBB, 客戶, IT部門 |
| 類別 | TEXT | 項目類型 | Milestone, Task |
| 預計開始 (原始) | DATE | 原始計畫開始 | 11/01/2024 |
| 預計結束 (原始) | DATE | 原始計畫結束 | 11/10/2024 |
| 預計開始 (調整) | DATE | 調整後開始 | 11/03/2024 |
| 預計結束 (調整) | DATE | 調整後結束 | 11/15/2024 |
| 開始日期 | DATE | 實際開始 | 11/03/2024 |
| 結束日期 | DATE | 實際結束 | 11/14/2024 |
| 工作天數 | INTEGER | 工作日數 | 10 |
| 實際完成進度 | INTEGER | 完成百分比 | 80 |
| 狀態 | TEXT | 執行狀態 | 未開始/進行中/已完成 |
| 預估完成進度 | INTEGER | 系統計算 | 90 |
| 進度偏差 | INTEGER | 系統計算 | -10 |
| 備註說明 | TEXT | 備註 | 已過期 |
| 注意 | TEXT | 警示標記 | ⚠️ |

**日期格式**: mm/dd/yyyy (例如: 11/27/2024)

### Action Item 匯入格式

| 欄位名稱 | 資料類型 | 說明 | 範例 |
|---------|---------|------|------|
| Action 說明 | TEXT | 行動項目 | 客戶確認需求 |
| 負責單位 | TEXT | 負責人/單位 | 客戶, 內部/PMO |
| 到期日 | DATE | 預計完成日 | 12/30/2024 |
| 關聯 WBS | TEXT | 相關的 WBS ID | 2.1 |
| 優先級 | TEXT | 優先等級 | High/Medium/Low |
| 備註 | TEXT | 說明 | 等待回覆 |

---

## 核心功能規格

### A. 依賴關係管理 (Impact 分析)

#### A1. 視覺化依賴圖
- 顯示項目間的依賴關係
- 支援四種依賴類型 (FS/SS/FF/SF)
- 可設定 Lag/Lead 時間

#### A2. 延遲影響分析
當某項目延遲時,自動計算:
- 直接影響的項目清單
- 連鎖影響的項目清單
- 對關鍵里程碑的影響
- 建議的緩解方案

**輸出範例**:
```
⚠️ 延遲項目: 客戶審核需求
   原定: 2024-11-25 → 延至: 2024-11-30 (延遲 5 天)

📊 影響範圍:
   直接影響 (2 項):
   ├─ [WBS 2.1] 系統設計 (延遲 5 天) ⚠️ Critical
   └─ [Action] 開發環境準備 (延遲 5 天)
   
   連鎖影響 (3 項):
   ├─ [WBS 2.2] UI 設計
   ├─ [WBS 3.1] 開發階段 ⚠️ 里程碑
   └─ [WBS 4.1] 測試階段
```

#### A3. 關鍵路徑分析
- 自動計算專案關鍵路徑
- 標示關鍵路徑上的風險項目
- 計算總工期與浮時

#### A4. What-If 情境模擬
- 模擬項目延遲的影響
- 提供緩解方案建議
- 比較不同情境的結果

---

### B. Web 介面設計

#### B1. 儀表板 (Dashboard)

**整體狀態面板**:
- 專案進度圓餅圖 (未開始/進行中/已完成)
- 時程健康度指標 (綠/黃/紅燈)
- 本週重點事項卡片
- 風險提示區塊

**關鍵指標 (KPI)**:
- 準時完成率
- 平均延遲天數
- 客戶待辦項目數
- 逾期項目數

#### B2. 多視圖檢視

**視圖 1: WBS 階層樹狀圖**
```
專案 A
├─ 1.0 需求階段 [80%]
│  ├─ 1.1 需求訪談 [100%] ✓
│  │  └─ 📌 客戶提供文件 [逾期 3天] ⚠️
│  └─ 1.2 需求文件 [60%] →
└─ 2.0 設計階段 [0%]
   └─ 📌 確認設計規格 [未開始]
```

**視圖 2: 責任人視圖**
```
John (5 項待辦)
  ├─ [WBS] 1.1 需求訪談 (80%) →
  ├─ [Action] 更新時程 (逾期) ⚠️
  └─ ...

等待客戶 (3 項)
  ├─ 提供測試環境 (逾期 5天) 🔴
  └─ ...
```

**視圖 3: 時間軸視圖**
```
本週到期 (7 項)
逾期項目 (2 項) ⚠️
下週到期 (5 項)
```

**視圖 4: 甘特圖**
- 視覺化時程表
- 顯示三階段時程 (計畫/調整/實際)
- 標示依賴關係箭頭
- 高亮逾期項目

#### B3. 智慧篩選器

快速篩選條件:
- [ ] 只看我負責的
- [ ] 只看客戶責任
- [ ] 只看內部項目
- [ ] 只看逾期項目
- [ ] 只看本週到期
- [ ] 只看高優先級
- [ ] 只看 WBS 任務
- [ ] 只看 Action Items
- [ ] 只看獨立 Action (無關聯 WBS)

---

### C. 自動提醒與通知

#### C1. 逾期警告
- 每日檢查逾期項目
- 發送提醒通知
- 標示在儀表板上

#### C2. 到期提醒
- 提前 3 天提醒即將到期項目
- 分類通知 (自己負責 vs 等待他人)
- Email/系統通知

#### C3. 進度異常通知
- 實際進度 < 預估進度 超過 20%
- 關鍵路徑項目異常
- 客戶待辦項目逾期超過 3 天

---

## 報告產生規格

### 報告類型 1: 週報 (給團隊)

**包含內容**:
1. 本週完成項目 (✓)
2. 進行中項目 + 進度條
3. 需要協助的項目 (Blocked)
4. 下週重點工作
5. Action Items 狀態

**格式**: Excel (多 Sheet)
- Sheet 1: 摘要
- Sheet 2: 完成項目
- Sheet 3: 進行中項目
- Sheet 4: Action Items
- Sheet 5: 風險與問題

### 報告類型 2: 週報 (給長官)

**包含內容**:
1. 整體進度摘要 (圖表)
2. 關鍵里程碑狀態
3. 風險與議題 (只看 High/Critical)
4. 需要決策的事項

**格式**: PDF 或 PowerPoint
- 高層次摘要,過濾細節
- 視覺化圖表
- 重點標示

### 報告類型 3: 客戶溝通報告

**包含內容**:
1. 客戶相關的待辦事項
2. 等待客戶回覆的項目
3. 下一步行動計畫
4. 重要里程碑進度

**格式**: PDF
- 只顯示 owner_type = 'Client' 相關項目
- 專業格式
- 中英文支援

### 報告類型 4: 時程差異分析報告

**包含內容**:
1. 原始 vs 調整 vs 實際對比表
2. 延遲原因分析
3. 變更歷史追蹤
4. 趨勢圖表

**格式**: Excel
- 完整的資料表
- 自動計算延遲天數
- 變更歷史記錄

---

## 系統架構設計

### 目錄結構

```
project-tracking-system/
├── src/
│   ├── database/
│   │   ├── __init__.py
│   │   ├── schema.py           # 資料表定義
│   │   └── connection.py       # 資料庫連線
│   │
│   ├── backup/                 # 🆕 備份模組
│   │   ├── __init__.py
│   │   ├── auto_backup.py      # 自動備份
│   │   ├── schedule_backup.py  # 排程備份
│   │   ├── restore.py          # 資料還原
│   │   ├── verify_data.py      # 完整性檢查
│   │   ├── cloud_backup.py     # 雲端備份
│   │   └── monitor.py          # 備份監控
│   │
│   ├── importer/
│   │   ├── __init__.py
│   │   ├── excel_importer.py   # Excel 匯入邏輯
│   │   └── action_item.py      # Action Item 處理
│   │
│   ├── pending/                # 🆕 待辦清單模組
│   │   ├── __init__.py
│   │   ├── manager.py          # 待辦事項管理
│   │   ├── queries.py          # 待辦事項查詢
│   │   └── reports.py          # 待辦事項報告
│   │
│   ├── issues/                 # 🆕 問題追蹤模組
│   │   ├── __init__.py
│   │   ├── manager.py          # 問題管理
│   │   ├── lifecycle.py        # 問題生命週期
│   │   ├── escalation.py       # 問題升級機制
│   │   ├── analytics.py        # 問題分析
│   │   └── converter.py        # 待辦事項轉換
│   │
│   ├── wbs/                    # 🆕 WBS 管理模組
│   │   ├── __init__.py
│   │   ├── manager.py          # WBS 增刪改查
│   │   ├── inserter.py         # WBS 插入邏輯
│   │   ├── cascade_update.py   # 連鎖更新機制
│   │   ├── consistency.py      # 資料一致性檢查
│   │   ├── batch_ops.py        # 批次操作
│   │   └── auto_calculator.py  # 🆕 自動計算引擎
│   │
│   ├── query/
│   │   ├── __init__.py
│   │   ├── basic_queries.py    # 基本查詢
│   │   ├── analytics.py        # 分析查詢
│   │   └── dependencies.py     # 依賴關係查詢
│   │
│   ├── reports/
│   │   ├── __init__.py
│   │   ├── weekly_report.py    # 週報產生
│   │   ├── executive_report.py # 長官報告
│   │   ├── client_report.py    # 客戶報告
│   │   └── variance_report.py  # 差異分析
│   │
│   ├── impact/
│   │   ├── __init__.py
│   │   ├── analyzer.py         # Impact 分析
│   │   ├── critical_path.py    # 關鍵路徑
│   │   └── what_if.py          # 情境模擬
│   │
│   └── api/
│       ├── __init__.py
│       └── app.py              # Web API (Flask/FastAPI)
│
├── web/                        # Web 前端 (未來擴充)
│   ├── public/
│   └── src/
│
├── scripts/                    # 🆕 自動化腳本
│   ├── daily_auto_calculation.py   # 每日自動計算
│   ├── setup_cron.sh              # Linux/Mac 排程設定
│   └── setup_task_scheduler.ps1   # Windows 排程設定
│
│   ├── test_importer.py
│   ├── test_queries.py
│   └── test_reports.py
│
├── data/
│   ├── project_tracking.db     # SQLite 資料庫
│   ├── backups/                # 🆕 備份目錄
│   │   ├── daily/              # 每日備份 (保留 30 天)
│   │   ├── weekly/             # 每週備份 (保留 12 週)
│   │   ├── monthly/            # 每月備份 (永久保留)
│   │   └── manual/             # 手動備份
│   └── templates/              # Excel 範本
│
├── docs/
│   ├── user_guide.md
│   └── api_docs.md
│
├── requirements.txt
├── setup.py
└── README.md
```

### Python 套件需求

```txt
# requirements.txt
pandas>=2.0.0
openpyxl>=3.1.0
sqlite3
python-dateutil>=2.8.0
reportlab>=4.0.0        # PDF 產生
matplotlib>=3.7.0       # 圖表產生
seaborn>=0.12.0         # 視覺化

# Web 介面 (選用)
flask>=3.0.0
flask-cors>=4.0.0
# 或
fastapi>=0.100.0
uvicorn>=0.23.0

# 前端 (選用)
# React + Recharts
```

---

## 開發階段規劃

### Phase 1: 核心功能 (已完成)
- ✅ 資料庫 Schema 設計
- ✅ Excel 匯入功能
- ✅ 基本查詢功能
- ✅ 報告產生功能
- ✅ 待辦清單管理
- ✅ 問題管理追蹤
- ✅ WBS 完整管理功能 (新增/修改/刪除/插入/連鎖更新)
- ✅ WBS 自動計算功能 (工作天數/預估進度/進度偏差)
- ✅ 父項目進度自動匯總
- ✅ 資料一致性檢查與自動修復
- ✅ 資料備份機制

### Phase 2: 依賴關係管理 (待開發)
- 🔲 依賴關係建立與維護
- 🔲 Impact 分析引擎
- 🔲 關鍵路徑計算
- 🔲 What-If 情境模擬

### Phase 3: Web 介面 (待開發)
- 🔲 RESTful API 開發
- 🔲 前端介面設計
- 🔲 儀表板視覺化
- 🔲 互動式甘特圖

### Phase 4: 自動化與通知 (待開發)
- 🔲 自動提醒系統
- 🔲 Email 通知
- 🔲 排程任務
- 🔲 資料備份機制

---

## 使用情境範例

### 情境 1: 匯入現有 Excel WBS

```python
from src.importer.excel_importer import ProjectTrackingImporter

# 初始化
importer = ProjectTrackingImporter('data/project_tracking.db')

# 匯入 Excel
importer.import_from_excel(
    excel_file='現有專案狀態.xlsx',
    project_id='PRJ001',
    sheet_name=0
)
```

### 情境 2: 新增會議 Action Item

```python
# 手動新增
importer.add_action_item(
    project_id='PRJ001',
    action_data={
        'task_name': '客戶確認需求變更',
        'owner_unit': '客戶',
        'due_date': '12/30/2024',
        'related_wbs': '2.1',
        'notes': '等待客戶回覆'
    }
)
```

### 情境 3: 產生週報

```python
from src.query.basic_queries import ProjectTrackingQuery

query = ProjectTrackingQuery('data/project_tracking.db')
query.generate_weekly_report('PRJ001', 'weekly_report.xlsx')
```

### 情境 4: 查看 Impact 分析

```python
from src.impact.analyzer import ImpactAnalyzer

analyzer = ImpactAnalyzer('data/project_tracking.db')
impact = analyzer.analyze_delay(
    item_id='PRJ001_2.1',
    delay_days=5
)
print(impact['summary'])
```

### 情境 5: 管理待辦清單

```python
from src.pending.manager import PendingItemManager

pending = PendingItemManager('data/project_tracking.db')

# 新增待辦事項
pending.add_item(
    project_id='PRJ001',
    item_data={
        'task_date': '11/27/2024',
        'source_type': '客戶',
        'contact_info': '王小明 (wang@client.com)',
        'description': '確認需求變更',
        'expected_reply_date': '11/30/2024',
        'priority': 'High'
    }
)

# 標記已回覆
pending.mark_replied(
    pending_id=123,
    actual_date='11/28/2024',
    notes='已電話確認'
)

# 查詢逾期項目
overdue = pending.get_overdue_items('PRJ001')
```

### 情境 6: 執行資料備份

```python
from src.backup.auto_backup import BackupManager

backup = BackupManager('data/project_tracking.db')

# 手動備份
backup.backup_database('manual')

# 檢查資料完整性
from src.backup.verify_data import verify_database_integrity
verify_database_integrity('data/project_tracking.db')

# 從備份還原
backup.restore_from_backup('data/backups/daily/project_tracking_20241126.db')
```

### 情境 7: 問題管理追蹤

```python
from src.issues.manager import IssueManager
from src.issues.converter import convert_pending_to_issue

issue_mgr = IssueManager('data/project_tracking.db')

# 建立問題
issue_id = issue_mgr.create_issue(
    project_id='PRJ001',
    issue_data={
        'issue_title': '客戶環境連線問題',
        'issue_type': '技術問題',
        'severity': 'Critical',
        'priority': 'Urgent',
        'reported_by': '王工程師',
        'assigned_to': 'IT部門',
        'affected_wbs': '2.1,2.2',
        'estimated_impact_days': 5
    }
)

# 更新問題狀態
issue_mgr.update_status(
    issue_id=issue_id,
    new_status='In Progress',
    notes='IT部門開始處理',
    changed_by='李主管'
)

# 從待辦事項轉換
convert_pending_to_issue(pending_id=123)

# 查詢開放問題
open_issues = issue_mgr.get_open_issues('PRJ001')

# 問題影響分析
from src.issues.analytics import analyze_issue_impact
impact = analyze_issue_impact(issue_id)
```

### 情境 8: WBS 管理操作

```python
from src.wbs.manager import WBSManager
from src.wbs.consistency import check_data_consistency

wbs = WBSManager('data/project_tracking.db')

# 手動新增 WBS
wbs.add_item(
    project_id='PRJ001',
    wbs_data={
        'wbs_id': '3.2',
        'task_name': '單元測試',
        'parent_id': '3',
        'owner_unit': 'QA Team',
        'original_planned_start': '12/15/2024',
        'original_planned_end': '12/20/2024'
    }
)

# 在中間插入 WBS
wbs.insert_between(
    project_id='PRJ001',
    after_wbs='1.1',
    before_wbs='1.2',
    task_data={
        'task_name': '需求補充訪談',
        'owner_unit': 'BA Team'
    }
)

# 修改 WBS (會自動更新所有關聯)
wbs.update_item(
    item_id='PRJ001_1.2',
    updates={
        'task_name': '需求規格文件撰寫',
        'revised_planned_end': '12/05/2024',
        'actual_progress': 80
    }
)

# 變更 WBS 編號 (連鎖更新)
from src.wbs.cascade_update import update_wbs_id_with_cascade
changes = update_wbs_id_with_cascade('1.2', '1.3')
print(f"已更新: {changes}")

# 檢查關聯影響
from src.wbs.manager import check_wbs_references
refs = check_wbs_references('1.2')
print(f"Issues: {len(refs['issues'])}, Actions: {len(refs['action_items'])}")

# 刪除 WBS (軟刪除)
result = wbs.delete_item(
    wbs_id='1.5',
    strategy='soft'
)

# 檢查資料一致性
consistency = check_data_consistency('PRJ001')
if not consistency['is_consistent']:
    print(f"發現 {consistency['total_issues']} 個問題")
    
    # 自動修復
    from src.wbs.consistency import auto_fix_consistency_issues
    fixed = auto_fix_consistency_issues('PRJ001')
    print(f"已修復 {fixed['fixed_count']} 個問題")

# 批次操作
wbs.batch_update(
    wbs_ids=['2.1', '2.2', '2.3'],
    updates={'owner_unit': '新團隊'}
)

# 批次調整日期
wbs.batch_adjust_dates(
    wbs_ids=['3.1', '3.2'],
    shift_days=5  # 往後推 5 天
)

# 🆕 自動計算功能
from src.wbs.auto_calculator import WBSAutoCalculator

calculator = WBSAutoCalculator('data/project_tracking.db')

# 計算單一項目的工作天數和預估進度
result = calculator.on_dates_changed(
    item_id='PRJ001_1.2',
    old_dates={'start': '11/01/2024', 'end': '11/10/2024'},
    new_dates={'start': '11/03/2024', 'end': '11/15/2024'}
)
print(f"工作天數: {result['work_days']}")
print(f"預估進度: {result['progress_info']['estimated_progress']}%")

# 批次重新計算整個專案
calc_results = calculator.batch_recalculate_all('PRJ001')
print(f"已更新 {calc_results['updated']} 個項目")

# 根據子項目自動計算父項目進度
parent_progress = calculator.calculate_parent_progress('PRJ001_1')
print(f"父項目進度: {parent_progress}%")

# 手動觸發重新計算
from src.wbs.auto_calculator import recalculate_wbs_item
info = recalculate_wbs_item('PRJ001_1.2')
```

---

## 資料流程圖

```
Excel WBS 檔案
    ↓
[Excel Importer]
    ↓
SQLite Database ← [Manual Input] (Action Items)
    ↓
[Query Engine] ← [Impact Analyzer]
    ↓
[Report Generator]
    ↓
Output Files (Excel/PDF)
```

---

## 關鍵設計決策

### 1. 為什麼使用 SQLite?
- 不需要安裝資料庫伺服器
- 單一檔案,易於備份和移動
- 跨平台支援 (Mac/Windows)
- 適合個人或小團隊使用

### 2. 為什麼用三階段時程?
- **原始規劃**: 保留基線,用於績效評估
- **規劃調整**: 反映實際變更,用於執行追蹤
- **實際執行**: 記錄真實狀況,用於經驗學習

### 3. 為什麼分離 owner_type?
- 快速篩選客戶責任項目
- 產生客戶報告時直接查詢
- 追蹤內部 vs 外部依賴

### 4. 為什麼需要 item_dependencies?
- 解決「Impact 關聯難以掌握」的核心痛點
- 支援自動化影響分析
- 為關鍵路徑計算提供基礎

---

## Web 介面功能規格

### 1. 儀表板 (Dashboard)

**頁面佈局**:
```
┌────────────────────────────────────────────────────────────┐
│  🏠 儀表板                              🔔 3  [設定]        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  進行中專案  │ │  本週到期   │ │  逾期項目   │          │
│  │     3       │ │     5      │ │   ⚠️ 2     │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                            │
│  📊 專案概覽                                               │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 專案A   ████████████░░░░░░░░  60%   到期: 12/31     │ │
│  │ 專案B   ████████████████░░░░  80%   到期: 01/15     │ │
│  │ 專案C   ████░░░░░░░░░░░░░░░░  20%   到期: 02/28     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ⚠️ 逾期提醒                                              │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 🔴 [專案A] WBS 2.1 系統設計    逾期 3 天             │ │
│  │ 🟡 [專案B] 待辦: 客戶確認規格   逾期 1 天             │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  📅 本週待辦                                               │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ □ 12/12 準備會議資料                                  │ │
│  │ □ 12/13 提交週報                                      │ │
│  │ □ 12/15 系統測試                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**儀表板 API**:
```python
# GET /api/dashboard
def get_dashboard_data():
    return {
        "summary": {
            "active_projects": 3,
            "due_this_week": 5,
            "overdue_items": 2
        },
        "projects_overview": [
            {
                "project_id": "PRJ001",
                "project_name": "專案A",
                "progress": 60,
                "due_date": "2024-12-31",
                "status": "on_track"  # on_track / at_risk / delayed
            }
        ],
        "overdue_alerts": [
            {
                "type": "wbs",
                "project_name": "專案A",
                "item_name": "系統設計",
                "wbs_id": "2.1",
                "days_overdue": 3,
                "severity": "high"  # high=紅 / medium=黃
            }
        ],
        "upcoming_tasks": [
            {
                "date": "2024-12-12",
                "task": "準備會議資料",
                "type": "action_item"
            }
        ]
    }
```

### 2. 甘特圖 (Gantt Chart)

**頁面功能**:
```
┌────────────────────────────────────────────────────────────┐
│  📊 甘特圖            [專案A ▼]  [本月 ▼]  [匯出]          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  任務名稱          │ 12/1  12/8  12/15  12/22  12/29      │
│  ──────────────────┼──────────────────────────────────     │
│  ▼ 1. 需求階段     │ ████████                              │
│    1.1 需求訪談    │ ████ ✓                                │
│    1.2 需求文件    │     ████                              │
│  ▼ 2. 設計階段     │         ████████████                  │
│    2.1 系統設計    │         ████ 🔴                       │
│    2.2 DB 設計     │             ████                      │
│  ▼ 3. 開發階段     │                     ████████████      │
│                    │                                        │
│  圖例: ████ 已完成  ████ 進行中  ░░░░ 未開始  🔴 逾期      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**甘特圖需求**:
- 顯示 WBS 階層結構（可展開/收合）
- 顯示三種時程線：
  - 原始規劃（灰色虛線）
  - 調整規劃（藍色實線）
  - 實際執行（綠色/紅色）
- 視覺標示：
  - ✓ 已完成
  - 🔴 逾期
  - 📍 今日標記線
- 支援縮放（日/週/月）

**甘特圖 API**:
```python
# GET /api/gantt/{project_id}
def get_gantt_data(project_id: str):
    return {
        "tasks": [
            {
                "id": "PRJ001_1",
                "name": "1. 需求階段",
                "type": "group",
                "children": ["PRJ001_1.1", "PRJ001_1.2"],
                
                "original_start": "2024-12-01",
                "original_end": "2024-12-08",
                "revised_start": "2024-12-01",
                "revised_end": "2024-12-10",
                "actual_start": "2024-12-01",
                "actual_end": None,
                
                "progress": 60,
                "status": "in_progress",
                "is_overdue": False
            }
        ],
        "dependencies": [
            {
                "from": "PRJ001_1.1",
                "to": "PRJ001_1.2",
                "type": "FS"
            }
        ],
        "today": "2024-12-12"
    }
```

**甘特圖元件（frappe-gantt）**:
```javascript
import Gantt from 'frappe-gantt';

const tasks = [
    {
        id: '1',
        name: '需求訪談',
        start: '2024-12-01',
        end: '2024-12-05',
        progress: 100,
        dependencies: ''
    },
    {
        id: '2',
        name: '需求文件',
        start: '2024-12-06',
        end: '2024-12-10',
        progress: 50,
        dependencies: '1'
    }
];

const gantt = new Gantt("#gantt", tasks, {
    view_mode: 'Week',
    date_format: 'YYYY-MM-DD',
    language: 'zh'
});
```

### 3. 站內通知系統

**通知類型**:
| 類型 | 觸發條件 | 圖示 |
|------|---------|------|
| 逾期警告 | 項目超過預計完成日 | 🔴 |
| 即將到期 | 項目 3 天內到期 | 🟡 |
| 待辦提醒 | 待辦事項預期回覆日到期 | 📋 |
| 問題升級 | Issue 自動升級 | ⚠️ |

**通知顯示**:
```
┌────────────────────────────────────────┐
│  🔔 通知 (3)                    [全部已讀] │
├────────────────────────────────────────┤
│  🔴 WBS 2.1 系統設計已逾期 3 天          │
│     專案A · 2 小時前                     │
│  ────────────────────────────────────  │
│  🟡 WBS 3.1 即將於明天到期               │
│     專案B · 5 小時前                     │
│  ────────────────────────────────────  │
│  📋 待辦「客戶確認規格」已逾期            │
│     專案A · 1 天前                       │
├────────────────────────────────────────┤
│  [查看全部通知]                          │
└────────────────────────────────────────┘
```

**通知資料表**:
```sql
CREATE TABLE notifications (
    notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 通知內容
    type TEXT NOT NULL,           -- overdue / due_soon / pending / escalation
    title TEXT NOT NULL,
    message TEXT,
    severity TEXT DEFAULT 'info', -- info / warning / error
    
    -- 關聯資訊
    related_type TEXT,            -- wbs / issue / pending
    related_id TEXT,
    project_id TEXT,
    
    -- 狀態
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);
```

**通知服務**:
```python
# backend/services/notification_service.py

class NotificationService:
    
    def check_and_create_notifications(self):
        """每日檢查並產生通知"""
        self._check_overdue_wbs()
        self._check_due_soon_wbs()
        self._check_overdue_pending()
        self._check_issue_escalation()
    
    def _check_overdue_wbs(self):
        """檢查逾期的 WBS 項目"""
        overdue_items = self.db.query("""
            SELECT * FROM tracking_items 
            WHERE status != '已完成'
            AND revised_planned_end < date('now')
            AND item_type = 'WBS'
        """)
        
        for item in overdue_items:
            if not self._notification_exists(item['item_id'], 'overdue'):
                self._create_notification(
                    type='overdue',
                    title=f"WBS {item['wbs_id']} {item['task_name']} 已逾期",
                    message=f"逾期 {self._calc_overdue_days(item)} 天",
                    severity='error',
                    related_type='wbs',
                    related_id=item['item_id'],
                    project_id=item['project_id']
                )
```

**通知 API**:
```python
# GET /api/notifications
def get_notifications(unread_only: bool = False):
    """取得通知列表"""
    
# GET /api/notifications/count
def get_unread_count():
    """取得未讀通知數量"""
    return {"unread_count": 3}

# PUT /api/notifications/{id}/read
def mark_as_read(notification_id: int):
    """標記為已讀"""

# PUT /api/notifications/read-all
def mark_all_as_read():
    """全部標記已讀"""
```

---

## 啟動與部署

### Mac 一鍵啟動腳本

**啟動系統.command**（雙擊即可執行）:
```bash
#!/bin/bash

echo "===================================="
echo "   專案管理系統 啟動中..."
echo "===================================="
echo

# 切換到腳本所在目錄
cd "$(dirname "$0")"

# 檢查 Python
if ! command -v python3 &> /dev/null; then
    echo "[錯誤] 請先安裝 Python 3.8 以上版本"
    echo "執行: brew install python@3.11"
    read -p "按 Enter 關閉..."
    exit 1
fi

# 啟用虛擬環境（如果存在）
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# 啟動後端服務
echo "[1/2] 啟動後端服務..."
cd backend
python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# 等待服務啟動
sleep 3

# 開啟瀏覽器
echo "[2/2] 開啟瀏覽器..."
open http://localhost:8000

echo
echo "===================================="
echo "   系統已啟動！"
echo "   網址: http://localhost:8000"
echo ""
echo "   按 Ctrl+C 停止服務"
echo "===================================="

# 等待使用者中斷
wait $BACKEND_PID
```

**設定為可執行**:
```bash
chmod +x 啟動系統.command
```

**停止系統.command**:
```bash
#!/bin/bash
echo "正在停止服務..."
pkill -f "uvicorn main:app"
echo "服務已停止"
```

### 首次安裝腳本

**安裝依賴.command**:
```bash
#!/bin/bash

echo "===================================="
echo "   安裝專案管理系統依賴"
echo "===================================="

cd "$(dirname "$0")"

# 建立虛擬環境
echo "[1/4] 建立 Python 虛擬環境..."
python3 -m venv venv
source venv/bin/activate

# 安裝 Python 套件
echo "[2/4] 安裝 Python 套件..."
pip install -r requirements.txt

# 安裝前端依賴
echo "[3/4] 安裝前端依賴..."
cd frontend
npm install
npm run build
cd ..

# 初始化資料庫
echo "[4/4] 初始化資料庫..."
python3 backend/init_db.py

echo
echo "===================================="
echo "   安裝完成！"
echo "   請執行「啟動系統.command」開始使用"
echo "===================================="
```

**requirements.txt**:
```
fastapi==0.104.1
uvicorn==0.24.0
python-multipart==0.0.6
aiosqlite==0.19.0
pandas==2.1.3
openpyxl==3.1.2
python-dateutil==2.8.2
```

### 效能目標

| 指標 | 目標值 |
|------|--------|
| 啟動時間 | < 5 秒 |
| 首頁載入 | < 2 秒 |
| 記憶體使用 | < 200 MB |
| 磁碟空間 | < 100 MB（不含資料）|

---

## 開發階段規劃

### Phase 1: 基礎架構（Week 1-2）
- [ ] 建立 FastAPI 後端專案結構
- [ ] 設定 SQLite 資料庫連線與 Schema
- [ ] 實作基本 CRUD API
- [ ] 建立 React + Vite 前端專案
- [ ] 完成主版面 Layout 與 Sidebar

### Phase 2: 核心功能（Week 3-4）
- [ ] 儀表板頁面與 API
- [ ] WBS 清單與管理頁面
- [ ] 甘特圖整合（frappe-gantt）
- [ ] Excel 匯入功能

### Phase 3: 進階功能（Week 5-6）
- [ ] 站內通知系統
- [ ] Issue 問題管理
- [ ] 待辦清單管理
- [ ] 報表產生與匯出

### Phase 4: 優化與打包（Week 7）
- [ ] 前端打包優化
- [ ] 一鍵啟動腳本測試
- [ ] 使用說明文件（README.md）
- [ ] 整合測試與修正

---

## UI 配色建議

### 簡潔專業風格
```css
:root {
  /* 主色調 */
  --primary: #3B82F6;      /* 藍色 - 主要按鈕、連結 */
  --primary-dark: #2563EB;
  
  /* 背景 */
  --bg-main: #F9FAFB;      /* 淺灰 - 主背景 */
  --bg-card: #FFFFFF;      /* 白色 - 卡片背景 */
  
  /* 文字 */
  --text-primary: #111827;
  --text-secondary: #6B7280;
  
  /* 狀態色 */
  --success: #10B981;      /* 綠色 - 完成 */
  --warning: #F59E0B;      /* 黃色 - 警告 */
  --danger: #EF4444;       /* 紅色 - 逾期 */
  
  /* 邊框 */
  --border: #E5E7EB;
}
```

---

## 擴充性考量

### 未來可能的擴充方向

1. **多專案管理**
   - 跨專案資源分析
   - Portfolio 儀表板

2. **權限管理**
   - 使用者登入
   - 角色權限控管

3. **協作功能**
   - 即時更新通知
   - 評論與討論

4. **AI 輔助**
   - 智慧預測延遲風險
   - 自動排程建議

5. **整合外部工具**
   - Jira/Trello 匯入
   - Slack 通知
   - Google Calendar 同步

---

## 參考資料

### 專案管理方法論
- PMBOK 時程管理
- 關鍵路徑法 (CPM)
- 計畫評核術 (PERT)

### 後端技術文件
- FastAPI: https://fastapi.tiangolo.com/
- SQLite: https://www.sqlite.org/
- Pandas: https://pandas.pydata.org/
- OpenPyXL: https://openpyxl.readthedocs.io/

### 前端技術文件
- React: https://react.dev/
- Vite: https://vitejs.dev/
- Tailwind CSS: https://tailwindcss.com/
- Recharts: https://recharts.org/
- frappe-gantt: https://frappe.io/gantt

---

## 附錄

### A. 狀態值定義

**status 欄位**:
- `未開始`: 尚未開始執行
- `進行中`: 正在執行中
- `已完成`: 已完成
- `已暫停`: 臨時暫停 (選用)
- `已取消`: 已取消 (選用)

**dependency_type 欄位**:
- `FS`: Finish-to-Start (最常見)
- `SS`: Start-to-Start
- `FF`: Finish-to-Finish
- `SF`: Start-to-Finish (較少用)

**impact_level 欄位**:
- `Critical`: 影響專案交付日期
- `High`: 影響關鍵里程碑
- `Medium`: 影響一般時程
- `Low`: 影響輕微

### B. 命名規範

**item_id 格式**:
- WBS 項目: `{project_id}_{wbs_id}` (例: PRJ001_2.1)
- Action Item: `{project_id}_ACT_{序號}` (例: PRJ001_ACT_1)
- Issue: `{project_id}_ISS_{序號}` (例: PRJ001_ISS_1)

**project_id 格式**:
- 建議使用: `PRJ{年份}{流水號}` (例: PRJ2024001)

---

## 版本歷史

- **v2.0** (2024-12-12): 完整版規格文件
  - 合併 v1.5 核心功能與 v1.6 Web 介面規格
  - 確定技術棧：FastAPI + React + Vite
  - 新增系統架構圖與目錄結構
  - 新增儀表板功能規格（專案概覽、逾期提醒）
  - 新增甘特圖功能規格（frappe-gantt）
  - 新增站內通知系統規格
  - 新增 Mac 一鍵啟動方案
  - 新增開發階段規劃
  - 新增 UI 配色建議

- **v1.6** (2024-12-12): 新增 Web 介面補充規格
  - 新增輕量化 Web 架構設計
  - 新增儀表板規格
  - 新增甘特圖功能規格
  - 新增站內通知系統
  - 新增一鍵啟動方案

- **v0.5** (2024-11-27): 新增 WBS 自動計算功能
  - 新增工作天數自動計算 (排除週末和假日)
  - 新增預估完成進度自動計算 (基於時間比例)
  - 新增進度偏差自動計算 (實際 vs 預估)
  - 新增父項目進度自動匯總 (基於子項目加權平均)
  - 實作日期變更時自動觸發計算
  - 實作進度變更時自動觸發計算
  - 新增每日自動計算排程
  - 新增進度異常自動警示
  - Excel 匯入後自動計算

- **v0.4** (2024-11-27): 新增 WBS 完整管理功能
  - 新增 WBS 手動新增、修改、刪除功能
  - 新增 WBS 中間插入功能 (兩種策略)
  - 實作 WBS 編號變更的連鎖更新機制
  - 實作三種刪除策略 (軟刪除/硬刪除/重新分配)
  - 新增資料一致性檢查工具
  - 新增自動修復功能
  - 新增批次操作功能
  - 整合 WBS 變更與 Issue/Action/Pending 的關聯更新

- **v0.3** (2024-11-27): 新增問題管理追蹤功能
  - 新增 issue_tracking 資料表
  - 新增 issue_status_history 資料表
  - 實作問題生命週期管理
  - 實作問題升級機制
  - 實作待辦事項轉問題追蹤功能
  - 整合問題與 WBS 的 Impact 分析

- **v0.2** (2024-11-27): 新增備份與待辦清單功能
  - 新增完整的資料備份機制
  - 新增待辦清單管理功能
  - 新增 pending_items 資料表
  - 新增自動備份與雲端同步方案
  - 新增災難復原計畫

- **v0.1** (2024-11-27): 初始規格文件
  - 完成資料模型設計
  - 完成 Excel 匯入功能
  - 完成基本查詢與報告功能

---

**文件建立日期**: 2024-11-27  
**最後更新日期**: 2024-12-12  
**版本**: v2.0  
**作者**: 專案經理  
**用途**: 提供給 Claude Code 進行系統開發