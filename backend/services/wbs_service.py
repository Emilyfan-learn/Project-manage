"""
Business logic service for WBS items
"""
import sqlite3
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any
from backend.config import settings
from backend.models.wbs import WBSCreate, WBSUpdate, WBSResponse


class WBSService:
    """Service for managing WBS items"""

    def __init__(self):
        self.db_path = str(settings.database_path)
        self._settings_cache = {}
        self._settings_cache_time = None

    def _get_system_setting(self, key: str, default: Any = None) -> Any:
        """Get system setting value with caching"""
        # Refresh cache every 60 seconds
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

    def _get_holiday_dates(self) -> set:
        """Get all holiday dates as a set for quick lookup"""
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT holiday_date FROM holidays")
            rows = cursor.fetchall()
            return {row['holiday_date'] for row in rows}
        except Exception:
            # Table doesn't exist yet, return empty set
            return set()
        finally:
            conn.close()

    def _count_work_days(self, start_date: date, end_date: date, include_weekends: bool = True) -> int:
        """Count work days between two dates, excluding holidays"""
        if include_weekends:
            # Still need to exclude holidays even if weekends are included
            holiday_dates = self._get_holiday_dates()
            work_days = 0
            current = start_date
            while current <= end_date:
                date_str = current.strftime('%Y-%m-%d')
                if date_str not in holiday_dates:
                    work_days += 1
                current += timedelta(days=1)
            return work_days

        # Exclude weekends and holidays
        holiday_dates = self._get_holiday_dates()
        work_days = 0
        current = start_date
        while current <= end_date:
            date_str = current.strftime('%Y-%m-%d')
            # Monday = 0, Friday = 4, and not a holiday
            if current.weekday() < 5 and date_str not in holiday_dates:
                work_days += 1
            current += timedelta(days=1)
        return work_days

    def _natural_sort_key(self, wbs_id: str) -> list:
        """Generate a sort key for natural sorting of WBS IDs like '1.2.10'"""
        if not wbs_id:
            return [0]
        parts = wbs_id.split('.')
        result = []
        for part in parts:
            try:
                result.append(int(part))
            except ValueError:
                result.append(0)
        return result

    def _get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _generate_item_id(self, project_id: str, wbs_id: str) -> str:
        """Generate unique item_id for WBS"""
        return f"{project_id}_{wbs_id}"

    def _calculate_progress_metrics(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate estimated progress and variance

        Priority logic for date selection:
        1. If both revised_planned_start and revised_planned_end exist, use them
        2. Otherwise, use original_planned_start and original_planned_end

        This ensures that when schedule is adjusted, calculations reflect the new timeline.
        """
        # Determine which dates to use for calculation
        start_date = None
        end_date = None

        # Priority 1: Use revised plan if both start and end are available
        if item.get('revised_planned_start') and item.get('revised_planned_end'):
            start_date = item['revised_planned_start']
            end_date = item['revised_planned_end']
        # Priority 2: Use original plan
        elif item.get('original_planned_start') and item.get('original_planned_end'):
            start_date = item['original_planned_start']
            end_date = item['original_planned_end']

        # Get system settings
        include_weekends = self._get_system_setting('include_weekends', True)
        overdue_warning_days = int(self._get_system_setting('overdue_warning_days', 0))
        progress_lag_threshold = int(self._get_system_setting('progress_lag_threshold', 10))

        # Calculate estimated progress based on dates
        estimated_progress = 0
        if start_date and end_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                today = date.today()

                if today >= end:
                    estimated_progress = 100
                elif today <= start:
                    estimated_progress = 0
                else:
                    # Use work days calculation based on setting
                    total_days = self._count_work_days(start, end, include_weekends)
                    elapsed_days = self._count_work_days(start, today, include_weekends)
                    if total_days > 0:
                        estimated_progress = int((elapsed_days / total_days) * 100)
            except (ValueError, ZeroDivisionError):
                estimated_progress = 0

        # Calculate progress variance
        actual_progress = item.get('actual_progress', 0) or 0
        progress_variance = actual_progress - estimated_progress

        # Check if behind schedule based on threshold
        # If progress_variance is negative and exceeds threshold, mark as behind
        is_behind_schedule = False
        if item.get('status') != '已完成' and progress_variance < 0:
            is_behind_schedule = abs(progress_variance) >= progress_lag_threshold

        # Check if overdue (with warning days)
        # Priority: Use revised end date if available, otherwise use original end date
        is_overdue = False
        if item.get('status') != '已完成':
            overdue_check_date = item.get('revised_planned_end') or item.get('original_planned_end')
            if overdue_check_date:
                try:
                    end_date_obj = datetime.strptime(overdue_check_date, '%Y-%m-%d').date()
                    # Apply warning days - mark as overdue N days before actual due date
                    warning_date = end_date_obj - timedelta(days=overdue_warning_days)
                    is_overdue = date.today() > warning_date
                except ValueError:
                    pass

        return {
            'estimated_progress': estimated_progress,
            'progress_variance': progress_variance,
            'is_overdue': is_overdue,
            'is_behind_schedule': is_behind_schedule
        }

    def create_wbs(self, wbs_data: WBSCreate) -> WBSResponse:
        """Create a new WBS item"""
        conn = self._get_connection()
        cursor = conn.cursor()

        item_id = self._generate_item_id(wbs_data.project_id, wbs_data.wbs_id)

        # Convert parent_id from wbs_id format to item_id format if provided
        parent_item_id = None
        if wbs_data.parent_id:
            # If parent_id looks like a wbs_id (doesn't contain '_'), convert it
            if '_' not in wbs_data.parent_id:
                parent_item_id = self._generate_item_id(wbs_data.project_id, wbs_data.parent_id)
            else:
                # Already in item_id format
                parent_item_id = wbs_data.parent_id

        # Parse owner_unit to determine owner_type and primary/secondary owners
        owner_type = None
        primary_owner = None
        secondary_owner = None

        if wbs_data.owner_unit:
            if '客戶' in wbs_data.owner_unit:
                owner_type = 'Client'
                primary_owner = wbs_data.owner_unit
            elif '/' in wbs_data.owner_unit:
                owner_type = 'Department'
                parts = wbs_data.owner_unit.split('/')
                primary_owner = parts[0].strip()
                secondary_owner = parts[1].strip() if len(parts) > 1 else None
            else:
                owner_type = 'Internal'
                primary_owner = wbs_data.owner_unit

        cursor.execute("""
            INSERT OR REPLACE INTO tracking_items (
                item_id, project_id, wbs_id, parent_id, task_name, item_type, category,
                owner_unit, owner_type, primary_owner, secondary_owner,
                original_planned_start, original_planned_end,
                revised_planned_start, revised_planned_end,
                actual_start_date, actual_end_date, work_days,
                actual_progress, status, notes, alert_flag, is_internal,
                source, source_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            item_id, wbs_data.project_id, wbs_data.wbs_id, parent_item_id,
            wbs_data.task_name, 'WBS', wbs_data.category,
            wbs_data.owner_unit, owner_type, primary_owner, secondary_owner,
            wbs_data.original_planned_start, wbs_data.original_planned_end,
            wbs_data.revised_planned_start, wbs_data.revised_planned_end,
            wbs_data.actual_start_date, wbs_data.actual_end_date, wbs_data.work_days,
            wbs_data.actual_progress, wbs_data.status, wbs_data.notes, wbs_data.alert_flag, wbs_data.is_internal,
            'Manual', date.today()
        ))

        conn.commit()
        conn.close()

        return self.get_wbs_by_id(item_id)

    def get_wbs_by_id(self, item_id: str) -> Optional[WBSResponse]:
        """Get WBS item by ID"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM tracking_items WHERE item_id = ? AND item_type = 'WBS'
        """, (item_id,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        item_dict = dict(row)
        metrics = self._calculate_progress_metrics(item_dict)
        item_dict.update(metrics)

        return WBSResponse(**item_dict)

    def get_wbs_list(
        self,
        project_id: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
        include_internal: bool = True,
        exclude_completed: bool = False
    ) -> List[WBSResponse]:
        """Get list of WBS items with filters"""
        conn = self._get_connection()
        cursor = conn.cursor()

        query = "SELECT * FROM tracking_items WHERE item_type = 'WBS'"
        params = []

        if project_id:
            query += " AND project_id = ?"
            params.append(project_id)

        if status:
            query += " AND status = ?"
            params.append(status)

        if not include_internal:
            query += " AND (is_internal = 0 OR is_internal IS NULL)"

        if exclude_completed:
            query += " AND status NOT IN ('已完成', '已取消')"

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        items = []
        for row in rows:
            item_dict = dict(row)
            metrics = self._calculate_progress_metrics(item_dict)
            item_dict.update(metrics)
            items.append(WBSResponse(**item_dict))

        # Natural sort by wbs_id
        items.sort(key=lambda x: self._natural_sort_key(x.wbs_id))

        # Apply pagination after sorting
        return items[skip:skip + limit]

    def get_wbs_count(self, project_id: Optional[str] = None) -> int:
        """Get total count of WBS items"""
        conn = self._get_connection()
        cursor = conn.cursor()

        query = "SELECT COUNT(*) FROM tracking_items WHERE item_type = 'WBS'"
        params = []

        if project_id:
            query += " AND project_id = ?"
            params.append(project_id)

        cursor.execute(query, params)
        count = cursor.fetchone()[0]
        conn.close()

        return count

    def update_wbs(self, item_id: str, wbs_update: WBSUpdate) -> Optional[WBSResponse]:
        """Update WBS item"""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Build dynamic UPDATE query based on provided fields
        update_fields = []
        params = []

        update_data = wbs_update.model_dump(exclude_unset=True)

        # Convert parent_id from wbs_id format to item_id format if provided
        if 'parent_id' in update_data and update_data['parent_id']:
            # Get the project_id for this item
            cursor.execute("SELECT project_id FROM tracking_items WHERE item_id = ?", (item_id,))
            row = cursor.fetchone()
            if row:
                project_id = row[0]
                # If parent_id looks like a wbs_id (doesn't contain '_'), convert it
                if '_' not in update_data['parent_id']:
                    update_data['parent_id'] = self._generate_item_id(project_id, update_data['parent_id'])
                # else: Already in item_id format, use as-is

        # Parse owner_unit if provided
        if 'owner_unit' in update_data and update_data['owner_unit']:
            owner_unit = update_data['owner_unit']
            if '客戶' in owner_unit:
                update_data['owner_type'] = 'Client'
                update_data['primary_owner'] = owner_unit
            elif '/' in owner_unit:
                update_data['owner_type'] = 'Department'
                parts = owner_unit.split('/')
                update_data['primary_owner'] = parts[0].strip()
                update_data['secondary_owner'] = parts[1].strip() if len(parts) > 1 else None
            else:
                update_data['owner_type'] = 'Internal'
                update_data['primary_owner'] = owner_unit

        for field, value in update_data.items():
            update_fields.append(f"{field} = ?")
            params.append(value)

        if not update_fields:
            return self.get_wbs_by_id(item_id)

        # Add updated_at
        update_fields.append("updated_at = ?")
        params.append(datetime.now())

        params.append(item_id)

        query = f"UPDATE tracking_items SET {', '.join(update_fields)} WHERE item_id = ?"

        cursor.execute(query, params)
        conn.commit()
        conn.close()

        return self.get_wbs_by_id(item_id)

    def delete_wbs(self, item_id: str) -> bool:
        """Delete WBS item"""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Check if item exists
        cursor.execute("SELECT item_id FROM tracking_items WHERE item_id = ?", (item_id,))
        if not cursor.fetchone():
            conn.close()
            return False

        # Delete dependencies first
        cursor.execute("""
            DELETE FROM item_dependencies
            WHERE predecessor_id = ? OR successor_id = ?
        """, (item_id, item_id))

        # Delete the item
        cursor.execute("DELETE FROM tracking_items WHERE item_id = ?", (item_id,))

        conn.commit()
        conn.close()

        return True

    def get_wbs_tree(
        self,
        project_id: str,
        include_internal: bool = True,
        exclude_completed: bool = False
    ) -> List[Dict[str, Any]]:
        """Get WBS items in tree structure"""
        items = self.get_wbs_list(
            project_id=project_id,
            limit=10000,
            include_internal=include_internal,
            exclude_completed=exclude_completed
        )

        # Build tree structure
        items_dict = {item.item_id: item.model_dump() for item in items}

        # Add children lists
        for item in items_dict.values():
            item['children'] = []
            item['level'] = len(item['wbs_id'].split('.'))

        # Build parent-child relationships
        root_items = []
        for item in items_dict.values():
            if item['parent_id'] and item['parent_id'] in items_dict:
                parent = items_dict[item['parent_id']]
                parent['children'].append(item)
            else:
                root_items.append(item)

        # Sort root items and children naturally
        def sort_tree(items_list):
            items_list.sort(key=lambda x: self._natural_sort_key(x['wbs_id']))
            for item in items_list:
                if item['children']:
                    sort_tree(item['children'])

        sort_tree(root_items)
        return root_items

    def get_children(self, item_id: str) -> List[WBSResponse]:
        """Get all children of a WBS item"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM tracking_items
            WHERE parent_id = ? AND item_type = 'WBS'
        """, (item_id,))

        rows = cursor.fetchall()
        conn.close()

        items = []
        for row in rows:
            item_dict = dict(row)
            metrics = self._calculate_progress_metrics(item_dict)
            item_dict.update(metrics)
            items.append(WBSResponse(**item_dict))

        # Natural sort by wbs_id
        items.sort(key=lambda x: self._natural_sort_key(x.wbs_id))
        return items
