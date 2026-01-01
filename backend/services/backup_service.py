"""
Backup service for database management
"""
import shutil
import sqlite3
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
from backend.config import settings


class BackupService:
    """Service for managing database backups"""

    def __init__(self):
        self.db_path = settings.database_path
        self.backup_dir = settings.database_path.parent / "backups"
        self.backup_dir.mkdir(exist_ok=True)

    def create_backup(self, description: Optional[str] = None) -> Dict:
        """Create a new database backup"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"backup_{timestamp}.db"
        backup_path = self.backup_dir / backup_filename

        # Create backup by copying database file
        shutil.copy2(self.db_path, backup_path)

        # Get database stats
        file_size = backup_path.stat().st_size

        # Store metadata in a separate file
        metadata_path = self.backup_dir / f"backup_{timestamp}.meta"
        metadata = {
            "filename": backup_filename,
            "created_at": datetime.now().isoformat(),
            "description": description or "Manual backup",
            "size": file_size,
            "original_path": str(self.db_path)
        }

        with open(metadata_path, 'w') as f:
            import json
            json.dump(metadata, f, indent=2)

        return {
            "filename": backup_filename,
            "path": str(backup_path),
            "size": file_size,
            "created_at": metadata["created_at"],
            "description": metadata["description"]
        }

    def list_backups(self) -> List[Dict]:
        """List all available backups"""
        backups = []

        for backup_file in sorted(self.backup_dir.glob("backup_*.db"), reverse=True):
            # Try to load metadata
            meta_file = backup_file.with_suffix('.meta')
            metadata = {}

            if meta_file.exists():
                try:
                    import json
                    with open(meta_file, 'r') as f:
                        metadata = json.load(f)
                except Exception:
                    pass

            # Get file stats
            stat = backup_file.stat()

            backups.append({
                "filename": backup_file.name,
                "path": str(backup_file),
                "size": metadata.get("size", stat.st_size),
                "created_at": metadata.get("created_at", datetime.fromtimestamp(stat.st_mtime).isoformat()),
                "description": metadata.get("description", "Backup"),
                "can_restore": True
            })

        return backups

    def get_backup(self, filename: str) -> Optional[Path]:
        """Get backup file path"""
        backup_path = self.backup_dir / filename

        if backup_path.exists() and backup_path.suffix == '.db':
            return backup_path

        return None

    def delete_backup(self, filename: str) -> bool:
        """Delete a backup file"""
        backup_path = self.backup_dir / filename
        meta_path = backup_path.with_suffix('.meta')

        if not backup_path.exists():
            return False

        # Delete backup file
        backup_path.unlink()

        # Delete metadata if exists
        if meta_path.exists():
            meta_path.unlink()

        return True

    def restore_backup(self, filename: str) -> bool:
        """Restore database from backup"""
        backup_path = self.backup_dir / filename

        if not backup_path.exists():
            return False

        # Create a backup of current database before restore
        self.create_backup(description="Auto-backup before restore")

        # Restore by copying backup over current database
        shutil.copy2(backup_path, self.db_path)

        return True

    def get_database_stats(self) -> Dict:
        """Get current database statistics"""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()

        stats = {
            "size": self.db_path.stat().st_size,
            "path": str(self.db_path),
            "tables": {}
        }

        # Get table counts
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()

        for (table_name,) in tables:
            if not table_name.startswith('sqlite_'):
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                    count = cursor.fetchone()[0]
                    stats["tables"][table_name] = count
                except Exception:
                    stats["tables"][table_name] = 0

        conn.close()

        return stats

    def cleanup_old_backups(self, keep_count: int = 10) -> int:
        """Keep only the most recent N backups"""
        backups = self.list_backups()

        if len(backups) <= keep_count:
            return 0

        deleted_count = 0
        for backup in backups[keep_count:]:
            if self.delete_backup(backup["filename"]):
                deleted_count += 1

        return deleted_count
