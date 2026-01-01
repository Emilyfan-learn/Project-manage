"""
Business logic service for Project management
"""
import sqlite3
from datetime import datetime
from typing import List, Optional, Dict, Any
from backend.config import settings
from backend.models.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectStats


class ProjectService:
    """Service for managing projects"""

    def __init__(self):
        self.db_path = str(settings.database_path)

    def _get_connection(self):
        """Get database connection"""
        try:
            # Check if database file exists
            from pathlib import Path
            db_file = Path(self.db_path)
            if not db_file.exists():
                raise FileNotFoundError(
                    f"Database file not found at: {self.db_path}. "
                    "Please ensure the database has been initialized."
                )

            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            return conn
        except sqlite3.Error as e:
            raise RuntimeError(f"Failed to connect to database at {self.db_path}: {str(e)}")

    def create_project(self, project_data: ProjectCreate) -> ProjectResponse:
        """Create a new project"""
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO projects (
                    project_id, project_name, description, status
                ) VALUES (?, ?, ?, ?)
            """, (
                project_data.project_id,
                project_data.project_name,
                project_data.description,
                project_data.status
            ))

            conn.commit()
            return self.get_project_by_id(project_data.project_id)
        except sqlite3.IntegrityError:
            raise ValueError(f"Project with ID '{project_data.project_id}' already exists")
        finally:
            conn.close()

    def get_project_by_id(self, project_id: str) -> Optional[ProjectResponse]:
        """Get project by ID with statistics"""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Get project basic info
        cursor.execute("""
            SELECT * FROM projects WHERE project_id = ?
        """, (project_id,))

        row = cursor.fetchone()
        if not row:
            conn.close()
            return None

        project_dict = dict(row)

        # Get WBS statistics
        cursor.execute("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = '已完成' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = '進行中' THEN 1 ELSE 0 END) as in_progress
            FROM tracking_items
            WHERE project_id = ? AND item_type = 'WBS'
        """, (project_id,))

        wbs_stats = cursor.fetchone()
        project_dict['total_wbs'] = wbs_stats['total'] or 0
        project_dict['completed_wbs'] = wbs_stats['completed'] or 0
        project_dict['in_progress_wbs'] = wbs_stats['in_progress'] or 0

        # Get issue statistics
        cursor.execute("""
            SELECT COUNT(*) as total
            FROM issue_tracking
            WHERE project_id = ?
        """, (project_id,))

        issue_stats = cursor.fetchone()
        project_dict['total_issues'] = issue_stats['total'] or 0

        # Get pending items statistics
        cursor.execute("""
            SELECT COUNT(*) as total
            FROM pending_items
            WHERE project_id = ?
        """, (project_id,))

        pending_stats = cursor.fetchone()
        project_dict['total_pending'] = pending_stats['total'] or 0

        conn.close()
        return ProjectResponse(**project_dict)

    def get_project_list(
        self,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[ProjectResponse]:
        """Get list of projects with filters"""
        conn = self._get_connection()
        cursor = conn.cursor()

        query = "SELECT * FROM projects WHERE 1=1"
        params = []

        if status:
            query += " AND status = ?"
            params.append(status)

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, skip])

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        # Get statistics for each project
        projects = []
        for row in rows:
            project = self.get_project_by_id(row['project_id'])
            if project:
                projects.append(project)

        return projects

    def get_project_count(self, status: Optional[str] = None) -> int:
        """Get total count of projects"""
        conn = self._get_connection()
        cursor = conn.cursor()

        query = "SELECT COUNT(*) FROM projects WHERE 1=1"
        params = []

        if status:
            query += " AND status = ?"
            params.append(status)

        cursor.execute(query, params)
        count = cursor.fetchone()[0]
        conn.close()

        return count

    def update_project(self, project_id: str, project_update: ProjectUpdate) -> Optional[ProjectResponse]:
        """Update project"""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Build dynamic UPDATE query
        update_fields = []
        params = []

        update_data = project_update.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            update_fields.append(f"{field} = ?")
            params.append(value)

        if not update_fields:
            conn.close()
            return self.get_project_by_id(project_id)

        # Add updated_at
        update_fields.append("updated_at = ?")
        params.append(datetime.now())

        params.append(project_id)

        query = f"UPDATE projects SET {', '.join(update_fields)} WHERE project_id = ?"

        cursor.execute(query, params)
        conn.commit()
        conn.close()

        return self.get_project_by_id(project_id)

    def delete_project(self, project_id: str) -> bool:
        """Delete project and all related data"""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Check if project exists
        cursor.execute("SELECT project_id FROM projects WHERE project_id = ?", (project_id,))
        if not cursor.fetchone():
            conn.close()
            return False

        # Delete related data (cascade delete)
        # Note: In production, consider soft delete or confirmation

        # Delete tracking items
        cursor.execute("DELETE FROM tracking_items WHERE project_id = ?", (project_id,))

        # Delete issues
        cursor.execute("DELETE FROM issue_tracking WHERE project_id = ?", (project_id,))

        # Delete pending items
        cursor.execute("DELETE FROM pending_items WHERE project_id = ?", (project_id,))

        # Delete the project
        cursor.execute("DELETE FROM projects WHERE project_id = ?", (project_id,))

        conn.commit()
        conn.close()

        return True

    def get_project_stats(self, project_id: str) -> Optional[ProjectStats]:
        """Get detailed project statistics"""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Get project basic info
        cursor.execute("""
            SELECT project_id, project_name FROM projects WHERE project_id = ?
        """, (project_id,))

        row = cursor.fetchone()
        if not row:
            conn.close()
            return None

        stats = {
            'project_id': row['project_id'],
            'project_name': row['project_name']
        }

        # WBS Statistics
        cursor.execute("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = '已完成' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = '進行中' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = '未開始' THEN 1 ELSE 0 END) as not_started,
                SUM(CASE WHEN is_overdue = 1 THEN 1 ELSE 0 END) as overdue,
                AVG(actual_progress) as avg_progress
            FROM tracking_items
            WHERE project_id = ? AND item_type = 'WBS'
        """, (project_id,))

        wbs_stats = cursor.fetchone()
        stats['total_wbs'] = wbs_stats['total'] or 0
        stats['completed_wbs'] = wbs_stats['completed'] or 0
        stats['in_progress_wbs'] = wbs_stats['in_progress'] or 0
        stats['not_started_wbs'] = wbs_stats['not_started'] or 0
        stats['overdue_wbs'] = wbs_stats['overdue'] or 0
        stats['overall_progress'] = round(wbs_stats['avg_progress'] or 0, 2)

        # Issue Statistics
        cursor.execute("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status IN ('Open', 'In Progress') THEN 1 ELSE 0 END) as open,
                SUM(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) as critical
            FROM issue_tracking
            WHERE project_id = ?
        """, (project_id,))

        issue_stats = cursor.fetchone()
        stats['total_issues'] = issue_stats['total'] or 0
        stats['open_issues'] = issue_stats['open'] or 0
        stats['resolved_issues'] = issue_stats['resolved'] or 0
        stats['critical_issues'] = issue_stats['critical'] or 0

        # Pending Items Statistics
        cursor.execute("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN is_replied = 1 THEN 1 ELSE 0 END) as replied,
                SUM(CASE WHEN expected_reply_date < date('now') AND is_replied = 0 THEN 1 ELSE 0 END) as overdue
            FROM pending_items
            WHERE project_id = ?
        """, (project_id,))

        pending_stats = cursor.fetchone()
        stats['total_pending'] = pending_stats['total'] or 0
        stats['pending_replied'] = pending_stats['replied'] or 0
        stats['pending_overdue'] = pending_stats['overdue'] or 0

        # Determine health status
        health_status = "Healthy"
        if stats['critical_issues'] > 0 or stats['overdue_wbs'] > 3:
            health_status = "Critical"
        elif stats['open_issues'] > 5 or stats['overdue_wbs'] > 0:
            health_status = "Warning"

        stats['health_status'] = health_status

        conn.close()
        return ProjectStats(**stats)
