"""
Business logic service for Pending Items management
"""
import sqlite3
from datetime import date, datetime
from typing import List, Optional, Dict, Any
from backend.config import settings
from backend.models.pending import (
    PendingCreate, PendingUpdate, PendingResponse, PendingStats,
    PendingReplyCreate, PendingReplyResponse, PendingWithReplies
)


class PendingService:
    """Service for managing pending items"""

    def __init__(self):
        self.db_path = str(settings.database_path)

    def _get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _calculate_pending_metrics(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate is_overdue and days_until_due"""
        is_overdue = False
        days_until_due = None

        if item.get('expected_completion_date') and not item.get('is_replied'):
            try:
                expected_date = datetime.strptime(item['expected_completion_date'], '%Y-%m-%d').date()
                today = date.today()

                is_overdue = today > expected_date
                days_until_due = (expected_date - today).days
            except (ValueError, TypeError):
                pass

        return {
            'is_overdue': is_overdue,
            'days_until_due': days_until_due
        }

    def create_pending(self, pending_data: PendingCreate) -> PendingResponse:
        """Create a new pending item"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO pending_items (
                project_id, task_date, source_type, contact_info, description,
                planned_start_date, expected_completion_date, handling_notes,
                related_wbs, related_action_item, related_issue_id,
                status, priority
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            pending_data.project_id,
            pending_data.task_date,
            pending_data.source_type,
            pending_data.contact_info,
            pending_data.description,
            pending_data.planned_start_date,
            pending_data.expected_completion_date,
            pending_data.handling_notes,
            pending_data.related_wbs,
            pending_data.related_action_item,
            pending_data.related_issue_id,
            pending_data.status,
            pending_data.priority
        ))

        pending_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return self.get_pending_by_id(pending_id)

    def get_pending_by_id(self, pending_id: int) -> Optional[PendingResponse]:
        """Get pending item by ID"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM pending_items WHERE pending_id = ?
        """, (pending_id,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        item_dict = dict(row)
        metrics = self._calculate_pending_metrics(item_dict)
        item_dict.update(metrics)

        return PendingResponse(**item_dict)

    def get_pending_list(
        self,
        project_id: Optional[str] = None,
        status: Optional[str] = None,
        source_type: Optional[str] = None,
        is_replied: Optional[bool] = None,
        priority: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[PendingResponse]:
        """Get list of pending items with filters"""
        conn = self._get_connection()
        cursor = conn.cursor()

        query = "SELECT * FROM pending_items WHERE 1=1"
        params = []

        if project_id:
            query += " AND project_id = ?"
            params.append(project_id)

        if status:
            query += " AND status = ?"
            params.append(status)

        if source_type:
            query += " AND source_type = ?"
            params.append(source_type)

        if is_replied is not None:
            query += " AND is_replied = ?"
            params.append(1 if is_replied else 0)

        if priority:
            query += " AND priority = ?"
            params.append(priority)

        query += " ORDER BY task_date DESC, created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, skip])

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        items = []
        for row in rows:
            item_dict = dict(row)
            metrics = self._calculate_pending_metrics(item_dict)
            item_dict.update(metrics)
            items.append(PendingResponse(**item_dict))

        return items

    def get_pending_count(
        self,
        project_id: Optional[str] = None,
        status: Optional[str] = None,
        source_type: Optional[str] = None,
        is_replied: Optional[bool] = None,
        priority: Optional[str] = None
    ) -> int:
        """Get total count of pending items"""
        conn = self._get_connection()
        cursor = conn.cursor()

        query = "SELECT COUNT(*) FROM pending_items WHERE 1=1"
        params = []

        if project_id:
            query += " AND project_id = ?"
            params.append(project_id)

        if status:
            query += " AND status = ?"
            params.append(status)

        if source_type:
            query += " AND source_type = ?"
            params.append(source_type)

        if is_replied is not None:
            query += " AND is_replied = ?"
            params.append(1 if is_replied else 0)

        if priority:
            query += " AND priority = ?"
            params.append(priority)

        cursor.execute(query, params)
        count = cursor.fetchone()[0]
        conn.close()

        return count

    def update_pending(self, pending_id: int, pending_update: PendingUpdate) -> Optional[PendingResponse]:
        """Update pending item"""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Build dynamic UPDATE query
        update_fields = []
        params = []

        update_data = pending_update.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            update_fields.append(f"{field} = ?")
            params.append(value)

        if not update_fields:
            conn.close()
            return self.get_pending_by_id(pending_id)

        # Add updated_at
        update_fields.append("updated_at = ?")
        params.append(datetime.now())

        params.append(pending_id)

        query = f"UPDATE pending_items SET {', '.join(update_fields)} WHERE pending_id = ?"

        cursor.execute(query, params)
        conn.commit()
        conn.close()

        return self.get_pending_by_id(pending_id)

    def delete_pending(self, pending_id: int) -> bool:
        """Delete pending item"""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Check if item exists
        cursor.execute("SELECT pending_id FROM pending_items WHERE pending_id = ?", (pending_id,))
        if not cursor.fetchone():
            conn.close()
            return False

        cursor.execute("DELETE FROM pending_items WHERE pending_id = ?", (pending_id,))

        conn.commit()
        conn.close()

        return True

    def mark_as_replied(self, pending_id: int) -> Optional[PendingResponse]:
        """Mark pending item as replied"""
        update_data = PendingUpdate(
            is_replied=True,
            actual_completion_date=date.today(),
            status="已完成"
        )
        return self.update_pending(pending_id, update_data)

    def get_pending_stats(self, project_id: Optional[str] = None) -> PendingStats:
        """Get pending items statistics"""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Base query
        where_clause = "WHERE 1=1"
        params = []

        if project_id:
            where_clause += " AND project_id = ?"
            params.append(project_id)

        # Get status counts
        cursor.execute(f"""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = '待處理' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = '處理中' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = '已完成' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = '已取消' THEN 1 ELSE 0 END) as cancelled,
                SUM(CASE WHEN is_replied = 1 THEN 1 ELSE 0 END) as replied,
                SUM(CASE WHEN is_replied = 0 THEN 1 ELSE 0 END) as not_replied,
                SUM(CASE WHEN expected_completion_date < date('now') AND is_replied = 0 THEN 1 ELSE 0 END) as overdue,
                SUM(CASE WHEN priority = 'High' THEN 1 ELSE 0 END) as high_priority,
                SUM(CASE WHEN priority = 'Medium' THEN 1 ELSE 0 END) as medium_priority,
                SUM(CASE WHEN priority = 'Low' THEN 1 ELSE 0 END) as low_priority
            FROM pending_items
            {where_clause}
        """, params)

        stats_row = cursor.fetchone()

        # Get source counts
        cursor.execute(f"""
            SELECT source_type, COUNT(*) as count
            FROM pending_items
            {where_clause}
            GROUP BY source_type
        """, params)

        source_rows = cursor.fetchall()
        by_source = {row['source_type']: row['count'] for row in source_rows}

        conn.close()

        return PendingStats(
            total=stats_row['total'] or 0,
            pending=stats_row['pending'] or 0,
            in_progress=stats_row['in_progress'] or 0,
            completed=stats_row['completed'] or 0,
            cancelled=stats_row['cancelled'] or 0,
            replied=stats_row['replied'] or 0,
            not_replied=stats_row['not_replied'] or 0,
            overdue=stats_row['overdue'] or 0,
            high_priority=stats_row['high_priority'] or 0,
            medium_priority=stats_row['medium_priority'] or 0,
            low_priority=stats_row['low_priority'] or 0,
            by_source=by_source
        )

    def get_overdue_items(self, project_id: Optional[str] = None) -> List[PendingResponse]:
        """Get all overdue pending items"""
        conn = self._get_connection()
        cursor = conn.cursor()

        query = """
            SELECT * FROM pending_items
            WHERE expected_completion_date < date('now')
            AND is_replied = 0
            AND status NOT IN ('已完成', '已取消')
        """
        params = []

        if project_id:
            query += " AND project_id = ?"
            params.append(project_id)

        query += " ORDER BY expected_completion_date ASC"

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        items = []
        for row in rows:
            item_dict = dict(row)
            metrics = self._calculate_pending_metrics(item_dict)
            item_dict.update(metrics)
            items.append(PendingResponse(**item_dict))

        return items

    def add_reply(self, pending_id: int, reply_data: PendingReplyCreate) -> PendingReplyResponse:
        """Add a reply to a pending item"""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Check if pending item exists
        cursor.execute("SELECT pending_id FROM pending_items WHERE pending_id = ?", (pending_id,))
        if not cursor.fetchone():
            conn.close()
            raise ValueError(f"Pending item {pending_id} not found")

        # Insert reply
        cursor.execute("""
            INSERT INTO pending_replies (
                pending_id, reply_date, reply_content, replied_by
            ) VALUES (?, ?, ?, ?)
        """, (
            pending_id,
            reply_data.reply_date,
            reply_data.reply_content,
            reply_data.replied_by
        ))

        reply_id = cursor.lastrowid

        # Update pending_items to mark as replied (for backward compatibility)
        cursor.execute("""
            UPDATE pending_items
            SET is_replied = 1, actual_completion_date = ?
            WHERE pending_id = ?
        """, (reply_data.reply_date, pending_id))

        conn.commit()

        # Get the created reply
        cursor.execute("SELECT * FROM pending_replies WHERE reply_id = ?", (reply_id,))
        row = cursor.fetchone()
        conn.close()

        return PendingReplyResponse(**dict(row))

    def get_replies(self, pending_id: int) -> List[PendingReplyResponse]:
        """Get all replies for a pending item"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM pending_replies
            WHERE pending_id = ?
            ORDER BY reply_date DESC, created_at DESC
        """, (pending_id,))

        rows = cursor.fetchall()
        conn.close()

        return [PendingReplyResponse(**dict(row)) for row in rows]

    def get_pending_with_replies(self, pending_id: int) -> Optional[PendingWithReplies]:
        """Get pending item with all its replies"""
        pending = self.get_pending_by_id(pending_id)
        if not pending:
            return None

        replies = self.get_replies(pending_id)

        return PendingWithReplies(
            **pending.model_dump(),
            replies=replies,
            reply_count=len(replies)
        )
