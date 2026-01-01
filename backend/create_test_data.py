#!/usr/bin/env python3
"""
建立測試資料腳本
"""
import sqlite3
import os
from datetime import datetime, timedelta

def create_test_data():
    # 連接資料庫
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'project_tracking.db')
    print(f"資料庫路徑: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("開始建立測試資料...")

    # 1. 建立測試專案
    print("\n1. 建立測試專案...")
    cursor.execute("""
        INSERT OR REPLACE INTO projects
        (project_id, project_name, description, status)
        VALUES
        ('PRJ001', '電子商務平台開發', '建立全新的電子商務平台，包含前後端開發、金流整合和物流系統', 'Active')
    """)

    # 2. 建立 WBS 項目（使用 tracking_items 表）
    print("2. 建立 WBS 項目...")

    # 使用當前日期 (2025)
    today = datetime.now()

    # 先刪除舊資料
    cursor.execute("DELETE FROM tracking_items WHERE project_id = 'PRJ001'")

    wbs_data = [
        # Phase 1: 需求分析 (已完成)
        ('WBS-001', 'PRJ001', 'WBS-001', None, '需求分析', 'WBS', 'Phase 1',
         None, None, '王小明', None,
         (today - timedelta(days=30)).strftime('%Y-%m-%d'),
         (today - timedelta(days=15)).strftime('%Y-%m-%d'),
         None, None,
         (today - timedelta(days=30)).strftime('%Y-%m-%d'),
         (today - timedelta(days=15)).strftime('%Y-%m-%d'),
         15, 100, 100, 0, '已完成', 0, None, None, None, None, None),

        # Phase 2: 系統設計 (已完成)
        ('WBS-002', 'PRJ001', 'WBS-002', None, '系統架構設計', 'WBS', 'Phase 2',
         None, None, '張工程師', None,
         (today - timedelta(days=14)).strftime('%Y-%m-%d'),
         (today - timedelta(days=7)).strftime('%Y-%m-%d'),
         None, None,
         (today - timedelta(days=14)).strftime('%Y-%m-%d'),
         (today - timedelta(days=5)).strftime('%Y-%m-%d'),
         9, 100, 100, 0, '已完成', 0, None, None, None, None, None),

        ('WBS-003', 'PRJ001', 'WBS-003', None, '資料庫設計', 'WBS', 'Phase 2',
         None, None, '張工程師', None,
         (today - timedelta(days=10)).strftime('%Y-%m-%d'),
         (today - timedelta(days=5)).strftime('%Y-%m-%d'),
         None, None,
         (today - timedelta(days=10)).strftime('%Y-%m-%d'),
         (today - timedelta(days=3)).strftime('%Y-%m-%d'),
         7, 100, 100, 0, '已完成', 0, None, None, None, None, None),

        # Phase 3: 開發中
        ('WBS-004', 'PRJ001', 'WBS-004', None, '前端開發 - 商品頁面', 'WBS', 'Phase 3',
         None, None, '陳前端', None,
         (today - timedelta(days=5)).strftime('%Y-%m-%d'),
         (today + timedelta(days=10)).strftime('%Y-%m-%d'),
         None, None,
         (today - timedelta(days=5)).strftime('%Y-%m-%d'),
         None,
         None, 60, 50, 10, '進行中', 0, None, None, None, None, None),

        ('WBS-005', 'PRJ001', 'WBS-005', None, '後端開發 - API 實作', 'WBS', 'Phase 3',
         None, None, '林後端', None,
         (today - timedelta(days=3)).strftime('%Y-%m-%d'),
         (today + timedelta(days=12)).strftime('%Y-%m-%d'),
         None, (today + timedelta(days=15)).strftime('%Y-%m-%d'),
         (today - timedelta(days=3)).strftime('%Y-%m-%d'),
         None,
         None, 45, 30, 15, '進行中', 0, None, None, None, None, None),

        ('WBS-006', 'PRJ001', 'WBS-006', None, '金流整合', 'WBS', 'Phase 3',
         None, None, '林後端', None,
         (today + timedelta(days=5)).strftime('%Y-%m-%d'),
         (today + timedelta(days=20)).strftime('%Y-%m-%d'),
         None, None,
         None, None,
         None, 0, 0, 0, '未開始', 0, None, None, None, None, None),

        # Phase 4: 測試
        ('WBS-007', 'PRJ001', 'WBS-007', None, '單元測試', 'WBS', 'Phase 4',
         None, None, '測試團隊', None,
         (today + timedelta(days=15)).strftime('%Y-%m-%d'),
         (today + timedelta(days=25)).strftime('%Y-%m-%d'),
         None, None,
         None, None,
         None, 0, 0, 0, '未開始', 0, None, None, None, None, None),

        ('WBS-008', 'PRJ001', 'WBS-008', None, '整合測試', 'WBS', 'Phase 4',
         None, None, '測試團隊', None,
         (today + timedelta(days=26)).strftime('%Y-%m-%d'),
         (today + timedelta(days=35)).strftime('%Y-%m-%d'),
         None, None,
         None, None,
         None, 0, 0, 0, '未開始', 0, None, None, None, None, None),
    ]

    cursor.executemany("""
        INSERT OR REPLACE INTO tracking_items
        (item_id, project_id, wbs_id, parent_id, task_name, item_type, category,
         owner_unit, owner_type, primary_owner, secondary_owner,
         original_planned_start, original_planned_end,
         revised_planned_start, revised_planned_end,
         actual_start_date, actual_end_date, work_days,
         actual_progress, estimated_progress, progress_variance,
         status, is_overdue, notes, alert_flag, source, source_date, source_reference)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, wbs_data)

    # 3. 建立待辦事項
    print("3. 建立待辦事項...")

    # 先刪除舊資料
    cursor.execute("DELETE FROM pending_items WHERE project_id = 'PRJ001'")

    pending_data = [
        ('PRJ001', today.strftime('%Y-%m-%d'), '客戶', '客戶經理',
         '客戶要求修改商品頁面配色', (today + timedelta(days=3)).strftime('%Y-%m-%d'),
         0, None, '已與設計師確認配色方案', 'WBS-004', None, None, '處理中', 'High'),

        ('PRJ001', today.strftime('%Y-%m-%d'), '內部', 'PM',
         '確認金流服務商的合約細節', (today + timedelta(days=5)).strftime('%Y-%m-%d'),
         0, None, None, 'WBS-006', None, None, '待處理', 'High'),

        ('PRJ001', (today - timedelta(days=2)).strftime('%Y-%m-%d'), '客戶', '客戶經理',
         '提供測試帳號給客戶', (today + timedelta(days=1)).strftime('%Y-%m-%d'),
         0, None, '已建立測試環境', 'WBS-005', None, None, '處理中', 'Medium'),

        ('PRJ001', (today - timedelta(days=5)).strftime('%Y-%m-%d'), '自己', 'PM',
         '準備下週的進度報告', (today - timedelta(days=1)).strftime('%Y-%m-%d'),
         1, (today - timedelta(days=1)).strftime('%Y-%m-%d'), '報告已完成並寄送',
         None, None, None, '已完成', 'Low'),
    ]

    cursor.executemany("""
        INSERT INTO pending_items
        (project_id, task_date, source_type, contact_info, description,
         expected_reply_date, is_replied, actual_reply_date, handling_notes,
         related_wbs, related_action_item, related_issue_id, status, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, pending_data)

    # 4. 建立問題追蹤（使用 issue_tracking 表）
    print("4. 建立問題追蹤...")

    # 先刪除舊資料
    cursor.execute("DELETE FROM issue_tracking WHERE project_id = 'PRJ001'")

    issue_data = [
        ('PRJ001', 'API-001', 'API 回應時間過長',
         '商品列表 API 在資料量大時回應時間超過 3 秒',
         '技術問題', '阻礙者', 'High', 'High',
         '測試人員', today.strftime('%Y-%m-%d'), '林後端', '內部',
         'WBS-005', '影響使用者體驗，需要優化查詢效能', 3,
         'Open', None, None,
         (today + timedelta(days=7)).strftime('%Y-%m-%d'), None, None,
         0, None, None, None, None, None, 'Manual', None),

        ('PRJ001', 'UI-001', '商品圖片顯示異常',
         '在 Safari 瀏覽器上商品圖片無法正確載入',
         '技術問題', '問題', 'Medium', 'Medium',
         'QA', (today - timedelta(days=1)).strftime('%Y-%m-%d'), '陳前端', '內部',
         'WBS-004', '僅影響 Safari 使用者', 1,
         'In Progress', None, None,
         (today + timedelta(days=3)).strftime('%Y-%m-%d'), None, None,
         0, None, None, None, None, None, 'Manual', None),

        ('PRJ001', 'REQ-001', '客戶要求新增優惠券功能',
         '客戶希望在結帳時能使用優惠券',
         '需求變更', '風險', 'Low', 'Medium',
         '客戶經理', today.strftime('%Y-%m-%d'), 'PM', '客戶',
         None, '需評估開發時程影響', 5,
         'Open', None, None,
         (today + timedelta(days=10)).strftime('%Y-%m-%d'), None, None,
         0, None, None, None, None, None, 'Manual', None),
    ]

    cursor.executemany("""
        INSERT INTO issue_tracking
        (project_id, issue_number, issue_title, issue_description,
         issue_type, issue_category, severity, priority,
         reported_by, reported_date, assigned_to, owner_type,
         affected_wbs, impact_description, estimated_impact_days,
         status, resolution, root_cause,
         target_resolution_date, actual_resolution_date, closed_date,
         is_escalated, escalation_level, escalation_date, escalation_reason,
         communication_log, attachments, source, source_reference_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, issue_data)

    conn.commit()

    # 顯示統計
    print("\n✅ 測試資料建立完成！")
    print("\n統計資訊：")

    cursor.execute("SELECT COUNT(*) FROM projects")
    print(f"  專案: {cursor.fetchone()[0]} 個")

    cursor.execute("SELECT COUNT(*) FROM tracking_items")
    print(f"  WBS 項目: {cursor.fetchone()[0]} 個")

    cursor.execute("SELECT COUNT(*) FROM pending_items")
    print(f"  待辦事項: {cursor.fetchone()[0]} 個")

    cursor.execute("SELECT COUNT(*) FROM issue_tracking")
    print(f"  問題追蹤: {cursor.fetchone()[0]} 個")

    conn.close()

    print("\n您現在可以：")
    print("  1. 訪問 http://localhost:5173/projects 查看專案")
    print("  2. 訪問 http://localhost:5173/wbs 查看 WBS（專案 ID: PRJ001）")
    print("  3. 訪問 http://localhost:5173/gantt 查看甘特圖（專案 ID: PRJ001）")
    print("  4. 訪問 http://localhost:5173/pending 查看待辦清單（專案 ID: PRJ001）")
    print("  5. 訪問 http://localhost:5173/issues 查看問題追蹤（專案 ID: PRJ001）")

if __name__ == '__main__':
    create_test_data()
