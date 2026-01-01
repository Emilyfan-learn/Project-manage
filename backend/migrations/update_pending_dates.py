"""
Migration: Update pending items table to add start/end dates
"""
import sqlite3
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.config import settings


def migrate():
    """Update pending items table with new date fields"""
    conn = sqlite3.connect(str(settings.database_path))
    cursor = conn.cursor()

    try:
        # 1. Add new columns
        print("Adding new date columns...")

        # Add planned_start_date
        cursor.execute("""
            ALTER TABLE pending_items
            ADD COLUMN planned_start_date DATE
        """)
        print("✓ Added planned_start_date column")

        # Add expected_completion_date (copy from expected_reply_date)
        cursor.execute("""
            ALTER TABLE pending_items
            ADD COLUMN expected_completion_date DATE
        """)
        print("✓ Added expected_completion_date column")

        # Add actual_completion_date (copy from actual_reply_date)
        cursor.execute("""
            ALTER TABLE pending_items
            ADD COLUMN actual_completion_date DATE
        """)
        print("✓ Added actual_completion_date column")

        # 2. Migrate existing data
        print("\nMigrating existing data...")

        # Copy expected_reply_date to expected_completion_date
        cursor.execute("""
            UPDATE pending_items
            SET expected_completion_date = expected_reply_date
            WHERE expected_reply_date IS NOT NULL
        """)
        print("✓ Copied expected_reply_date to expected_completion_date")

        # Copy actual_reply_date to actual_completion_date
        cursor.execute("""
            UPDATE pending_items
            SET actual_completion_date = actual_reply_date
            WHERE actual_reply_date IS NOT NULL
        """)
        print("✓ Copied actual_reply_date to actual_completion_date")

        conn.commit()
        print("\n✅ Migration completed successfully")
        print("\nNote: Old columns (expected_reply_date, actual_reply_date) are kept for compatibility")
        print("You can remove them manually if needed after verifying the migration")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
