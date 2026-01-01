"""
Migration: Add is_internal column to tracking_items table
"""
import sqlite3
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.config import settings


def migrate():
    """Add is_internal column to tracking_items table"""
    conn = sqlite3.connect(str(settings.database_path))
    cursor = conn.cursor()

    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(tracking_items)")
        columns = [column[1] for column in cursor.fetchall()]

        if 'is_internal' not in columns:
            # Add is_internal column with default value False (0)
            cursor.execute("""
                ALTER TABLE tracking_items
                ADD COLUMN is_internal BOOLEAN DEFAULT 0
            """)
            print("✓ Added is_internal column to tracking_items table")
        else:
            print("✓ is_internal column already exists")

        conn.commit()
        print("✓ Migration completed successfully")

    except Exception as e:
        conn.rollback()
        print(f"✗ Migration failed: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
