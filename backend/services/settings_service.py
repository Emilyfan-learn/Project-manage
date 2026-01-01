"""
Business logic service for system and project settings
"""
import sqlite3
from typing import List, Optional, Dict, Any
from datetime import datetime
from backend.config import settings
from backend.models.settings import (
    SystemSettingCreate, SystemSettingUpdate, SystemSettingResponse,
    ProjectSettingCreate, ProjectSettingUpdate, ProjectSettingResponse
)


class SettingsService:
    """Service for managing system and project settings"""

    def __init__(self):
        self.db_path = str(settings.database_path)

    def _get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    # ==================== System Settings ====================

    def get_system_setting(self, setting_key: str) -> Optional[SystemSettingResponse]:
        """Get a system setting by key"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM system_settings WHERE setting_key = ?
        """, (setting_key,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        return SystemSettingResponse(**dict(row))

    def get_all_system_settings(self) -> List[SystemSettingResponse]:
        """Get all system settings"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM system_settings ORDER BY setting_key")
        rows = cursor.fetchall()
        conn.close()

        return [SystemSettingResponse(**dict(row)) for row in rows]

    def update_system_setting(self, setting_key: str, update_data: SystemSettingUpdate) -> Optional[SystemSettingResponse]:
        """Update a system setting"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE system_settings
            SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
            WHERE setting_key = ?
        """, (update_data.setting_value, setting_key))

        conn.commit()
        conn.close()

        return self.get_system_setting(setting_key)

    def get_setting_value(self, setting_key: str, default: Any = None) -> Any:
        """Get setting value with type conversion"""
        setting = self.get_system_setting(setting_key)

        if not setting:
            return default

        # Type conversion based on setting_type
        if setting.setting_type == 'number':
            try:
                return int(setting.setting_value)
            except ValueError:
                return float(setting.setting_value)
        elif setting.setting_type == 'boolean':
            return setting.setting_value.lower() in ['true', '1', 'yes']
        else:
            return setting.setting_value

    # ==================== Project Settings ====================

    def get_project_settings(self, project_id: str, setting_key: Optional[str] = None) -> List[ProjectSettingResponse]:
        """Get project settings"""
        conn = self._get_connection()
        cursor = conn.cursor()

        query = """
            SELECT * FROM project_settings
            WHERE project_id = ?
        """
        params = [project_id]

        if setting_key:
            query += " AND setting_key = ?"
            params.append(setting_key)

        query += " AND is_active = 1 ORDER BY display_order, setting_value"

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        return [ProjectSettingResponse(**dict(row)) for row in rows]

    def create_project_setting(self, setting_data: ProjectSettingCreate) -> ProjectSettingResponse:
        """Create a new project setting"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO project_settings (
                project_id, setting_key, setting_value, display_order, is_active
            ) VALUES (?, ?, ?, ?, ?)
        """, (
            setting_data.project_id,
            setting_data.setting_key,
            setting_data.setting_value,
            setting_data.display_order,
            setting_data.is_active
        ))

        setting_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return self.get_project_setting_by_id(setting_id)

    def get_project_setting_by_id(self, setting_id: int) -> Optional[ProjectSettingResponse]:
        """Get project setting by ID"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM project_settings WHERE setting_id = ?", (setting_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        return ProjectSettingResponse(**dict(row))

    def update_project_setting(self, setting_id: int, update_data: ProjectSettingUpdate) -> Optional[ProjectSettingResponse]:
        """Update a project setting"""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Build dynamic UPDATE query
        update_fields = []
        params = []

        data = update_data.model_dump(exclude_unset=True)
        for key, value in data.items():
            update_fields.append(f"{key} = ?")
            params.append(value)

        if not update_fields:
            return self.get_project_setting_by_id(setting_id)

        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(setting_id)

        query = f"UPDATE project_settings SET {', '.join(update_fields)} WHERE setting_id = ?"
        cursor.execute(query, params)

        conn.commit()
        conn.close()

        return self.get_project_setting_by_id(setting_id)

    def delete_project_setting(self, setting_id: int) -> bool:
        """Delete a project setting (soft delete)"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE project_settings
            SET is_active = 0, updated_at = CURRENT_TIMESTAMP
            WHERE setting_id = ?
        """, (setting_id,))

        success = cursor.rowcount > 0
        conn.commit()
        conn.close()

        return success

    # ==================== Owner Units (Shortcut methods) ====================

    def get_owner_units(self, project_id: str) -> List[str]:
        """Get list of owner units for a project"""
        settings = self.get_project_settings(project_id, 'owner_unit')
        return [s.setting_value for s in settings]

    def add_owner_unit(self, project_id: str, unit_name: str, display_order: int = 0) -> ProjectSettingResponse:
        """Add an owner unit to a project"""
        setting_data = ProjectSettingCreate(
            project_id=project_id,
            setting_key='owner_unit',
            setting_value=unit_name,
            display_order=display_order,
            is_active=True
        )
        return self.create_project_setting(setting_data)
