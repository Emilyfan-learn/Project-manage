"""
Business logic service for Issue Tracking
"""
import sqlite3
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any
from backend.config import settings
from backend.models.issue import (
    IssueCreate, IssueUpdate, IssueResponse, IssueStats,
    IssueStatusHistory, EscalateIssue, ResolveIssue
)


class IssueService:
    """Service for managing issues"""

    def __init__(self):
        self.db_path = str(settings.database_path)
        self._settings_cache = {}
        self._settings_cache_time = None

    def _get_system_setting(self, key: str, default: Any = None) -> Any:
        """Get system setting value with caching"""
        now = datetime.now()
        if self._settings_cache_time is None or (now - self._settings_cache_time).seconds > 60:
            self._settings_cache = {}
            self._settings_cache_time = now

        if key not in self._settings_cache:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT setting_value, setting_type FROM system_settings WHERE setting_key = ?", (key,))
            row = cursor.fetchone()
            conn.close()

            if row:
                value, setting_type = row['setting_value'], row['setting_type']
                if setting_type == 'number':
                    try:
                        self._settings_cache[key] = int(value)
                    except ValueError:
                        self._settings_cache[key] = float(value)
                elif setting_type == 'boolean':
                    self._settings_cache[key] = value.lower() in ['true', '1', 'yes']
                else:
                    self._settings_cache[key] = value
            else:
                self._settings_cache[key] = default

        return self._settings_cache.get(key, default)

    def _get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _generate_issue_number(self, project_id: str) -> str:
        """Generate unique issue number"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT COUNT(*) FROM issue_tracking WHERE project_id = ?
        """, (project_id,))

        count = cursor.fetchone()[0]
        conn.close()

        return f"ISS-{project_id}-{count + 1:03d}"

    def _calculate_issue_metrics(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate is_overdue and days_open"""
        is_overdue = False
        days_open = 0

        # Get overdue warning days from settings
        overdue_warning_days = self._get_system_setting('overdue_warning_days', 0)

        # Calculate days open
        if item.get('reported_date'):
            try:
                reported_date = datetime.strptime(item['reported_date'], '%Y-%m-%d').date()
                if item.get('closed_date'):
                    closed_date = datetime.strptime(item['closed_date'], '%Y-%m-%d').date()
                    days_open = (closed_date - reported_date).days
                else:
                    days_open = (date.today() - reported_date).days
            except (ValueError, TypeError):
                pass

        # Check if overdue (with warning days)
        if item.get('target_resolution_date') and item.get('status') not in ['Resolved', 'Closed']:
            try:
                target_date = datetime.strptime(item['target_resolution_date'], '%Y-%m-%d').date()
                # Apply warning days - mark as overdue N days before actual due date
                warning_date = target_date - timedelta(days=overdue_warning_days)
                is_overdue = date.today() > warning_date
            except (ValueError, TypeError):
                pass

        return {
            'is_overdue': is_overdue,
            'days_open': days_open
        }

    def create_issue(self, issue_data: IssueCreate) -> IssueResponse:
        """Create a new issue"""
        conn = self._get_connection()
        cursor = conn.cursor()

        issue_number = self._generate_issue_number(issue_data.project_id)

        cursor.execute("""
            INSERT INTO issue_tracking (
                project_id, issue_number, issue_title, issue_description,
                issue_type, issue_category, severity, priority,
                reported_by, reported_date, assigned_to, owner_type,
                affected_wbs, impact_description, estimated_impact_days,
                status, resolution, root_cause,
                target_resolution_date, source, source_reference_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            issue_data.project_id, issue_number, issue_data.issue_title,
            issue_data.issue_description, issue_data.issue_type, issue_data.issue_category,
            issue_data.severity, issue_data.priority, issue_data.reported_by,
            issue_data.reported_date, issue_data.assigned_to, issue_data.owner_type,
            issue_data.affected_wbs, issue_data.impact_description,
            issue_data.estimated_impact_days, issue_data.status,
            issue_data.resolution, issue_data.root_cause,
            issue_data.target_resolution_date, issue_data.source,
            issue_data.source_reference_id
        ))

        issue_id = cursor.lastrowid

        # Log status history
        self._log_status_change(
            cursor, issue_id, None, issue_data.status,
            issue_data.reported_by, "Issue created"
        )

        conn.commit()
        conn.close()

        return self.get_issue_by_id(issue_id)

    def _log_status_change(
        self, cursor, issue_id: int, old_status: Optional[str],
        new_status: str, changed_by: str, reason: Optional[str] = None
    ):
        """Log issue status change"""
        cursor.execute("""
            INSERT INTO issue_status_history (
                issue_id, old_status, new_status, change_date, changed_by, change_reason
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (issue_id, old_status, new_status, datetime.now(), changed_by, reason))

    def get_issue_by_id(self, issue_id: int) -> Optional[IssueResponse]:
        """Get issue by ID"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM issue_tracking WHERE issue_id = ?
        """, (issue_id,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        item_dict = dict(row)
        metrics = self._calculate_issue_metrics(item_dict)
        item_dict.update(metrics)

        return IssueResponse(**item_dict)

    def get_issue_list(
        self,
        project_id: Optional[str] = None,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        priority: Optional[str] = None,
        issue_type: Optional[str] = None,
        assigned_to: Optional[str] = None,
        is_escalated: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[IssueResponse]:
        """Get list of issues with filters"""
        conn = self._get_connection()
        cursor = conn.cursor()

        query = "SELECT * FROM issue_tracking WHERE 1=1"
        params = []

        if project_id:
            query += " AND project_id = ?"
            params.append(project_id)

        if status:
            query += " AND status = ?"
            params.append(status)

        if severity:
            query += " AND severity = ?"
            params.append(severity)

        if priority:
            query += " AND priority = ?"
            params.append(priority)

        if issue_type:
            query += " AND issue_type = ?"
            params.append(issue_type)

        if assigned_to:
            query += " AND assigned_to = ?"
            params.append(assigned_to)

        if is_escalated is not None:
            query += " AND is_escalated = ?"
            params.append(1 if is_escalated else 0)

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, skip])

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        items = []
        for row in rows:
            item_dict = dict(row)
            metrics = self._calculate_issue_metrics(item_dict)
            item_dict.update(metrics)
            items.append(IssueResponse(**item_dict))

        return items

    def get_issue_count(
        self,
        project_id: Optional[str] = None,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        priority: Optional[str] = None,
        issue_type: Optional[str] = None,
        assigned_to: Optional[str] = None,
        is_escalated: Optional[bool] = None
    ) -> int:
        """Get total count of issues"""
        conn = self._get_connection()
        cursor = conn.cursor()

        query = "SELECT COUNT(*) FROM issue_tracking WHERE 1=1"
        params = []

        if project_id:
            query += " AND project_id = ?"
            params.append(project_id)

        if status:
            query += " AND status = ?"
            params.append(status)

        if severity:
            query += " AND severity = ?"
            params.append(severity)

        if priority:
            query += " AND priority = ?"
            params.append(priority)

        if issue_type:
            query += " AND issue_type = ?"
            params.append(issue_type)

        if assigned_to:
            query += " AND assigned_to = ?"
            params.append(assigned_to)

        if is_escalated is not None:
            query += " AND is_escalated = ?"
            params.append(1 if is_escalated else 0)

        cursor.execute(query, params)
        count = cursor.fetchone()[0]
        conn.close()

        return count

    def update_issue(self, issue_id: int, issue_update: IssueUpdate, changed_by: str = "System") -> Optional[IssueResponse]:
        """Update issue"""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Get current status
        cursor.execute("SELECT status FROM issue_tracking WHERE issue_id = ?", (issue_id,))
        current = cursor.fetchone()
        if not current:
            conn.close()
            return None

        old_status = current['status']

        # Build dynamic UPDATE query
        update_fields = []
        params = []

        update_data = issue_update.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            update_fields.append(f"{field} = ?")
            params.append(value)

        if not update_fields:
            conn.close()
            return self.get_issue_by_id(issue_id)

        # Add updated_at
        update_fields.append("updated_at = ?")
        params.append(datetime.now())

        params.append(issue_id)

        query = f"UPDATE issue_tracking SET {', '.join(update_fields)} WHERE issue_id = ?"

        cursor.execute(query, params)

        # Log status change if status was updated
        if 'status' in update_data and update_data['status'] != old_status:
            self._log_status_change(
                cursor, issue_id, old_status, update_data['status'],
                changed_by, "Status updated"
            )

        conn.commit()
        conn.close()

        return self.get_issue_by_id(issue_id)

    def delete_issue(self, issue_id: int) -> bool:
        """Delete issue"""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Check if issue exists
        cursor.execute("SELECT issue_id FROM issue_tracking WHERE issue_id = ?", (issue_id,))
        if not cursor.fetchone():
            conn.close()
            return False

        # Delete status history
        cursor.execute("DELETE FROM issue_status_history WHERE issue_id = ?", (issue_id,))

        # Delete the issue
        cursor.execute("DELETE FROM issue_tracking WHERE issue_id = ?", (issue_id,))

        conn.commit()
        conn.close()

        return True

    def escalate_issue(self, issue_id: int, escalate_data: EscalateIssue) -> Optional[IssueResponse]:
        """Escalate an issue"""
        update_data = IssueUpdate(
            is_escalated=True,
            escalation_level=escalate_data.escalation_level,
            escalation_reason=escalate_data.escalation_reason
        )

        conn = self._get_connection()
        cursor = conn.cursor()

        # Update escalation date
        cursor.execute("""
            UPDATE issue_tracking
            SET is_escalated = 1,
                escalation_level = ?,
                escalation_reason = ?,
                escalation_date = ?,
                updated_at = ?
            WHERE issue_id = ?
        """, (
            escalate_data.escalation_level,
            escalate_data.escalation_reason,
            date.today(),
            datetime.now(),
            issue_id
        ))

        # Log status change
        self._log_status_change(
            cursor, issue_id, None, "Escalated",
            escalate_data.changed_by,
            f"Escalated to {escalate_data.escalation_level}: {escalate_data.escalation_reason}"
        )

        conn.commit()
        conn.close()

        return self.get_issue_by_id(issue_id)

    def resolve_issue(self, issue_id: int, resolve_data: ResolveIssue) -> Optional[IssueResponse]:
        """Resolve an issue"""
        update_data = IssueUpdate(
            status="Resolved",
            resolution=resolve_data.resolution,
            root_cause=resolve_data.root_cause,
            actual_resolution_date=date.today()
        )

        return self.update_issue(issue_id, update_data, resolve_data.resolved_by)

    def close_issue(self, issue_id: int, changed_by: str = "System") -> Optional[IssueResponse]:
        """Close an issue"""
        update_data = IssueUpdate(
            status="Closed",
            closed_date=date.today()
        )

        return self.update_issue(issue_id, update_data, changed_by)

    def get_issue_history(self, issue_id: int) -> List[IssueStatusHistory]:
        """Get issue status history"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM issue_status_history
            WHERE issue_id = ?
            ORDER BY change_date DESC
        """, (issue_id,))

        rows = cursor.fetchall()
        conn.close()

        return [IssueStatusHistory(**dict(row)) for row in rows]

    def get_issue_stats(self, project_id: Optional[str] = None) -> IssueStats:
        """Get issue statistics"""
        conn = self._get_connection()
        cursor = conn.cursor()

        where_clause = "WHERE 1=1"
        params = []

        if project_id:
            where_clause += " AND project_id = ?"
            params.append(project_id)

        # Get status counts
        cursor.execute(f"""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed,
                SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled,
                SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) as high_severity,
                SUM(CASE WHEN severity = 'Medium' THEN 1 ELSE 0 END) as medium_severity,
                SUM(CASE WHEN severity = 'Low' THEN 1 ELSE 0 END) as low_severity,
                SUM(CASE WHEN is_escalated = 1 THEN 1 ELSE 0 END) as escalated,
                SUM(CASE WHEN target_resolution_date < date('now') AND status NOT IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) as overdue
            FROM issue_tracking
            {where_clause}
        """, params)

        stats_row = cursor.fetchone()

        # Get type counts
        cursor.execute(f"""
            SELECT issue_type, COUNT(*) as count
            FROM issue_tracking
            {where_clause}
            GROUP BY issue_type
        """, params)

        type_rows = cursor.fetchall()
        by_type = {row['issue_type']: row['count'] for row in type_rows}

        # Get category counts
        cursor.execute(f"""
            SELECT issue_category, COUNT(*) as count
            FROM issue_tracking
            {where_clause}
            GROUP BY issue_category
        """, params)

        category_rows = cursor.fetchall()
        by_category = {row['issue_category']: row['count'] for row in category_rows}

        # Get owner counts
        cursor.execute(f"""
            SELECT owner_type, COUNT(*) as count
            FROM issue_tracking
            {where_clause}
            GROUP BY owner_type
        """, params)

        owner_rows = cursor.fetchall()
        by_owner = {row['owner_type']: row['count'] for row in owner_rows if row['owner_type']}

        # Calculate average resolution days
        cursor.execute(f"""
            SELECT AVG(julianday(actual_resolution_date) - julianday(reported_date)) as avg_days
            FROM issue_tracking
            {where_clause}
            AND actual_resolution_date IS NOT NULL
        """, params)

        avg_row = cursor.fetchone()
        avg_resolution_days = round(avg_row['avg_days'] or 0, 2)

        conn.close()

        return IssueStats(
            total=stats_row['total'] or 0,
            open=stats_row['open'] or 0,
            in_progress=stats_row['in_progress'] or 0,
            pending=stats_row['pending'] or 0,
            resolved=stats_row['resolved'] or 0,
            closed=stats_row['closed'] or 0,
            cancelled=stats_row['cancelled'] or 0,
            critical=stats_row['critical'] or 0,
            high_severity=stats_row['high_severity'] or 0,
            medium_severity=stats_row['medium_severity'] or 0,
            low_severity=stats_row['low_severity'] or 0,
            escalated=stats_row['escalated'] or 0,
            overdue=stats_row['overdue'] or 0,
            by_type=by_type,
            by_category=by_category,
            by_owner=by_owner,
            avg_resolution_days=avg_resolution_days
        )
