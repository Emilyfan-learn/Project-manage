"""
Migration: Create settings tables for system and project settings
"""
import sqlite3
import sys
from pathlib import Path
import json

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.config import settings


def migrate():
    """Create settings tables"""
    conn = sqlite3.connect(str(settings.database_path))
    cursor = conn.cursor()

    try:
        # 1. System Settings table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS system_settings (
                setting_key TEXT PRIMARY KEY,
                setting_value TEXT NOT NULL,
                setting_type TEXT DEFAULT 'string',
                description TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Created system_settings table")

        # 2. Project Settings table (for owner units)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS project_settings (
                setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id TEXT NOT NULL,
                setting_key TEXT NOT NULL,
                setting_value TEXT NOT NULL,
                display_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(project_id, setting_key, setting_value)
            )
        """)
        print("✓ Created project_settings table")

        # 3. Holidays table (system-wide holidays)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS holidays (
                holiday_id INTEGER PRIMARY KEY AUTOINCREMENT,
                year INTEGER NOT NULL,
                holiday_date DATE NOT NULL,
                holiday_name TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(holiday_date)
            )
        """)
        print("✓ Created holidays table")

        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_project_settings_project ON project_settings(project_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_project_settings_key ON project_settings(setting_key)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_holidays_year ON holidays(year)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(holiday_date)")
        print("✓ Created indexes")

        # Insert default system settings
        default_settings = [
            # Display settings
            ('date_format', 'yyyy/MM/dd', 'string', '日期格式'),
            ('default_view_mode', 'Day', 'string', '預設視圖模式（甘特圖）'),
            ('items_per_page', '50', 'number', '每頁顯示筆數'),

            # Calculation rules
            ('progress_calculation', 'date_based', 'string', '進度計算方式（date_based: 基於日期, manual: 手動輸入）'),
            ('include_weekends', 'false', 'boolean', '工作天數計算是否包含週末'),
            ('overdue_warning_days', '3', 'number', '逾期警示天數（提前幾天警示）'),

            # Notification settings
            ('enable_overdue_alert', 'true', 'boolean', '啟用逾期提醒'),
            ('progress_lag_threshold', '10', 'number', '進度落後警示閾值（%）'),
        ]

        for key, value, type_, desc in default_settings:
            cursor.execute("""
                INSERT OR IGNORE INTO system_settings (setting_key, setting_value, setting_type, description)
                VALUES (?, ?, ?, ?)
            """, (key, value, type_, desc))

        print(f"✓ Inserted {len(default_settings)} default system settings")

        conn.commit()
        print("\n✅ Migration completed successfully")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
