"""
Business logic service for Item Dependencies
"""
import sqlite3
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any, Set
from backend.config import settings
from backend.models.dependency import (
    DependencyCreate,
    DependencyUpdate,
    DependencyResponse,
    ScheduleAdjustmentSuggestion,
    ScheduleImpactAnalysis
)


class DependencyService:
    """Service for managing item dependencies"""

    def __init__(self):
        self.db_path = str(settings.database_path)

    def _get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def create_dependency(self, dep_data: DependencyCreate) -> DependencyResponse:
        """Create a new dependency"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO item_dependencies (
                predecessor_id, successor_id, dependency_type,
                lag_days, impact_level, impact_description, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            dep_data.predecessor_id, dep_data.successor_id, dep_data.dependency_type,
            dep_data.lag_days, dep_data.impact_level, dep_data.impact_description,
            dep_data.is_active
        ))

        dependency_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return self.get_dependency_by_id(dependency_id)

    def get_dependency_by_id(self, dependency_id: int) -> Optional[DependencyResponse]:
        """Get dependency by ID with item details"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                d.*,
                p.wbs_id as predecessor_wbs_id,
                p.task_name as predecessor_task_name,
                s.wbs_id as successor_wbs_id,
                s.task_name as successor_task_name
            FROM item_dependencies d
            LEFT JOIN tracking_items p ON d.predecessor_id = p.item_id
            LEFT JOIN tracking_items s ON d.successor_id = s.item_id
            WHERE d.dependency_id = ?
        """, (dependency_id,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        return DependencyResponse(**dict(row))

    def get_dependencies_list(
        self,
        project_id: Optional[str] = None,
        item_id: Optional[str] = None,
        active_only: bool = True,
        skip: int = 0,
        limit: int = 100
    ) -> List[DependencyResponse]:
        """Get list of dependencies with filters"""
        conn = self._get_connection()
        cursor = conn.cursor()

        query = """
            SELECT
                d.*,
                p.wbs_id as predecessor_wbs_id,
                p.task_name as predecessor_task_name,
                s.wbs_id as successor_wbs_id,
                s.task_name as successor_task_name
            FROM item_dependencies d
            LEFT JOIN tracking_items p ON d.predecessor_id = p.item_id
            LEFT JOIN tracking_items s ON d.successor_id = s.item_id
            WHERE 1=1
        """
        params = []

        if active_only:
            query += " AND d.is_active = 1"

        if project_id:
            query += " AND (p.project_id = ? OR s.project_id = ?)"
            params.extend([project_id, project_id])

        if item_id:
            query += " AND (d.predecessor_id = ? OR d.successor_id = ?)"
            params.extend([item_id, item_id])

        query += " ORDER BY d.created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, skip])

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        return [DependencyResponse(**dict(row)) for row in rows]

    def get_dependencies_count(
        self,
        project_id: Optional[str] = None,
        item_id: Optional[str] = None,
        active_only: bool = True
    ) -> int:
        """Get total count of dependencies"""
        conn = self._get_connection()
        cursor = conn.cursor()

        query = """
            SELECT COUNT(*) FROM item_dependencies d
            LEFT JOIN tracking_items p ON d.predecessor_id = p.item_id
            WHERE 1=1
        """
        params = []

        if active_only:
            query += " AND d.is_active = 1"

        if project_id:
            query += " AND p.project_id = ?"
            params.append(project_id)

        if item_id:
            query += " AND (d.predecessor_id = ? OR d.successor_id = ?)"
            params.extend([item_id, item_id])

        cursor.execute(query, params)
        count = cursor.fetchone()[0]
        conn.close()

        return count

    def update_dependency(self, dependency_id: int, dep_update: DependencyUpdate) -> Optional[DependencyResponse]:
        """Update dependency"""
        conn = self._get_connection()
        cursor = conn.cursor()

        update_fields = []
        params = []

        update_data = dep_update.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            update_fields.append(f"{field} = ?")
            params.append(value)

        if not update_fields:
            return self.get_dependency_by_id(dependency_id)

        update_fields.append("updated_at = ?")
        params.append(datetime.now())

        params.append(dependency_id)

        query = f"UPDATE item_dependencies SET {', '.join(update_fields)} WHERE dependency_id = ?"

        cursor.execute(query, params)
        conn.commit()
        conn.close()

        return self.get_dependency_by_id(dependency_id)

    def delete_dependency(self, dependency_id: int) -> bool:
        """Delete dependency"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT dependency_id FROM item_dependencies WHERE dependency_id = ?", (dependency_id,))
        if not cursor.fetchone():
            conn.close()
            return False

        cursor.execute("DELETE FROM item_dependencies WHERE dependency_id = ?", (dependency_id,))

        conn.commit()
        conn.close()

        return True

    def get_successors(self, item_id: str, active_only: bool = True) -> List[DependencyResponse]:
        """Get all items that depend on this item (successors)"""
        conn = self._get_connection()
        cursor = conn.cursor()

        query = """
            SELECT
                d.*,
                p.wbs_id as predecessor_wbs_id,
                p.task_name as predecessor_task_name,
                s.wbs_id as successor_wbs_id,
                s.task_name as successor_task_name
            FROM item_dependencies d
            LEFT JOIN tracking_items p ON d.predecessor_id = p.item_id
            LEFT JOIN tracking_items s ON d.successor_id = s.item_id
            WHERE d.predecessor_id = ?
        """
        params = [item_id]

        if active_only:
            query += " AND d.is_active = 1"

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        return [DependencyResponse(**dict(row)) for row in rows]

    def get_predecessors(self, item_id: str, active_only: bool = True) -> List[DependencyResponse]:
        """Get all items that this item depends on (predecessors)"""
        conn = self._get_connection()
        cursor = conn.cursor()

        query = """
            SELECT
                d.*,
                p.wbs_id as predecessor_wbs_id,
                p.task_name as predecessor_task_name,
                s.wbs_id as successor_wbs_id,
                s.task_name as successor_task_name
            FROM item_dependencies d
            LEFT JOIN tracking_items p ON d.predecessor_id = p.item_id
            LEFT JOIN tracking_items s ON d.successor_id = s.item_id
            WHERE d.successor_id = ?
        """
        params = [item_id]

        if active_only:
            query += " AND d.is_active = 1"

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        return [DependencyResponse(**dict(row)) for row in rows]

    def _get_item(self, item_id: str) -> Optional[Dict[str, Any]]:
        """Get tracking item by ID"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM tracking_items WHERE item_id = ?", (item_id,))
        row = cursor.fetchone()
        conn.close()

        return dict(row) if row else None

    def _calculate_suggested_date(
        self,
        dependency: DependencyResponse,
        predecessor_item: Dict[str, Any]
    ) -> tuple[Optional[date], Optional[date]]:
        """Calculate suggested dates based on dependency type"""
        dep_type = dependency.dependency_type
        lag = dependency.lag_days

        # Get effective dates (use revised if available, otherwise original)
        pred_start = predecessor_item.get('revised_planned_start') or predecessor_item.get('original_planned_start')
        pred_end = predecessor_item.get('revised_planned_end') or predecessor_item.get('original_planned_end')

        if not pred_start or not pred_end:
            return None, None

        # Parse dates
        if isinstance(pred_start, str):
            pred_start = datetime.strptime(pred_start, '%Y-%m-%d').date()
        if isinstance(pred_end, str):
            pred_end = datetime.strptime(pred_end, '%Y-%m-%d').date()

        suggested_start = None
        suggested_end = None

        if dep_type == 'FS':  # Finish-to-Start
            suggested_start = pred_end + timedelta(days=lag + 1)
        elif dep_type == 'SS':  # Start-to-Start
            suggested_start = pred_start + timedelta(days=lag)
        elif dep_type == 'FF':  # Finish-to-Finish
            # Need to know successor duration to calculate start
            pass
        elif dep_type == 'SF':  # Start-to-Finish
            suggested_end = pred_start + timedelta(days=lag)

        return suggested_start, suggested_end

    def analyze_schedule_impact(
        self,
        item_id: str,
        date_changes: Dict[str, Any]
    ) -> ScheduleImpactAnalysis:
        """Analyze impact of schedule changes on dependent items"""
        source_item = self._get_item(item_id)
        if not source_item:
            raise ValueError(f"Item {item_id} not found")

        affected_items = []
        visited = set()

        def analyze_successors(current_id: str, chain: List[str]):
            """Recursively analyze all successors"""
            if current_id in visited:
                return
            visited.add(current_id)

            successors = self.get_successors(current_id, active_only=True)

            for dep in successors:
                successor_item = self._get_item(dep.successor_id)
                if not successor_item:
                    continue

                # Get current dates
                current_start = successor_item.get('revised_planned_start') or successor_item.get('original_planned_start')
                current_end = successor_item.get('revised_planned_end') or successor_item.get('original_planned_end')

                # Get predecessor item for calculation
                pred_item = self._get_item(dep.predecessor_id)
                if not pred_item:
                    continue

                # Calculate suggested dates
                suggested_start, suggested_end = self._calculate_suggested_date(dep, pred_item)

                # Determine if there's a delay
                delay_days = 0
                reason = f"依賴於 {dep.predecessor_wbs_id} ({dep.dependency_type})"

                if suggested_start and current_start:
                    if isinstance(current_start, str):
                        current_start = datetime.strptime(current_start, '%Y-%m-%d').date()
                    if suggested_start > current_start:
                        delay_days = (suggested_start - current_start).days
                        reason += f" - 建議延後 {delay_days} 天"

                if delay_days > 0 or suggested_start or suggested_end:
                    affected_items.append(ScheduleAdjustmentSuggestion(
                        item_id=successor_item['item_id'],
                        wbs_id=successor_item['wbs_id'],
                        task_name=successor_item['task_name'],
                        current_start=current_start if isinstance(current_start, date) else
                                     (datetime.strptime(current_start, '%Y-%m-%d').date() if current_start else None),
                        current_end=current_end if isinstance(current_end, date) else
                                   (datetime.strptime(current_end, '%Y-%m-%d').date() if current_end else None),
                        suggested_start=suggested_start,
                        suggested_end=suggested_end,
                        delay_days=delay_days,
                        reason=reason,
                        dependency_chain=chain + [dep.predecessor_wbs_id]
                    ))

                # Recursively check successors
                analyze_successors(dep.successor_id, chain + [dep.predecessor_wbs_id])

        # Start analysis from the source item
        analyze_successors(item_id, [source_item['wbs_id']])

        # Check if any critical items are affected
        critical_path_affected = any(
            sug.delay_days > 5 or 'Critical' in sug.reason
            for sug in affected_items
        )

        return ScheduleImpactAnalysis(
            source_item_id=source_item['item_id'],
            source_wbs_id=source_item['wbs_id'],
            source_task_name=source_item['task_name'],
            date_change=date_changes,
            affected_items=affected_items,
            total_affected=len(affected_items),
            critical_path_affected=critical_path_affected
        )
