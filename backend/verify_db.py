#!/usr/bin/env python3
"""
Database verification script
Checks if the database is properly initialized and accessible
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.config import settings
import sqlite3


def verify_database():
    """Verify database setup"""
    print("=" * 50)
    print("Database Verification")
    print("=" * 50)
    print()

    # 1. Check environment variables
    print("1. Environment Variables:")
    print(f"   DATABASE_PATH env: {os.getenv('DATABASE_PATH', 'NOT SET')}")
    print(f"   Config db_path: {settings.database_path}")
    print()

    # 2. Check if database file exists
    print("2. Database File:")
    db_path = Path(settings.database_path)
    if db_path.exists():
        print(f"   ✅ Database file exists: {db_path}")
        print(f"   File size: {db_path.stat().st_size} bytes")
        print(f"   Readable: {os.access(db_path, os.R_OK)}")
        print(f"   Writable: {os.access(db_path, os.W_OK)}")
    else:
        print(f"   ❌ Database file NOT found: {db_path}")
        print(f"   Parent directory exists: {db_path.parent.exists()}")
        return False
    print()

    # 3. Try to connect to database
    print("3. Database Connection:")
    try:
        conn = sqlite3.connect(str(settings.database_path))
        print(f"   ✅ Connection successful")

        # 4. Check if tables exist
        print()
        print("4. Database Tables:")
        cursor = conn.cursor()
        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table'
            ORDER BY name
        """)
        tables = cursor.fetchall()

        if tables:
            print(f"   ✅ Found {len(tables)} tables:")
            for table in tables:
                print(f"      - {table[0]}")

                # Count rows in each table
                cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
                count = cursor.fetchone()[0]
                print(f"        Rows: {count}")
        else:
            print(f"   ❌ No tables found - database not initialized!")
            return False

        print()
        print("5. Test Query (projects table):")
        try:
            cursor.execute("SELECT COUNT(*) FROM projects")
            count = cursor.fetchone()[0]
            print(f"   ✅ Projects table accessible")
            print(f"   Total projects: {count}")

            if count > 0:
                cursor.execute("SELECT project_id, project_name, status FROM projects LIMIT 5")
                projects = cursor.fetchall()
                print(f"   Sample projects:")
                for proj in projects:
                    print(f"      - {proj[0]}: {proj[1]} ({proj[2]})")
        except Exception as e:
            print(f"   ❌ Error querying projects: {e}")
            return False

        conn.close()

        print()
        print("=" * 50)
        print("✅ Database verification PASSED")
        print("=" * 50)
        return True

    except Exception as e:
        print(f"   ❌ Connection failed: {e}")
        return False


if __name__ == "__main__":
    success = verify_database()
    sys.exit(0 if success else 1)
