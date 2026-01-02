"""
Service for CSV import/export operations
Uses only Python built-in modules (no external dependencies)
CSV files can be opened directly in Excel
"""
import csv
import sqlite3
from datetime import datetime
from typing import Dict, Any, Optional, List
from io import StringIO
from backend.config import settings
from backend.models.wbs import WBSCreate
from backend.services.wbs_service import WBSService


class CSVService:
    """Service for CSV import/export - no external dependencies"""

    def __init__(self):
        self.db_path = str(settings.database_path)
        self.wbs_service = WBSService()

    def _parse_date(self, date_str: Any) -> Optional[str]:
        """Parse date from various formats to YYYY-MM-DD"""
        if date_str is None or str(date_str).strip() == '':
            return None

        try:
            date_str = str(date_str).strip()

            # If already a datetime object
            if isinstance(date_str, datetime):
                return date_str.strftime('%Y-%m-%d')

            # Try different formats
            for fmt in ['%Y/%m/%d', '%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y']:
                try:
                    dt = datetime.strptime(date_str, fmt)
                    return dt.strftime('%Y-%m-%d')
                except ValueError:
                    continue

            return None
        except Exception:
            return None

    def _clean_string(self, value: Any) -> Optional[str]:
        """Clean and convert value to string"""
        if value is None:
            return None
        s = str(value).strip()
        return s if s else None

    def _clean_parent_id(self, value: Any) -> Optional[str]:
        """Clean parent_id value"""
        if value is None or str(value).strip() == '':
            return None
        parent_str = str(value).strip()
        # Handle numeric values like 1.0 -> 1
        if parent_str.endswith('.0'):
            base = parent_str[:-2]
            if base.isdigit():
                return base
        return parent_str if parent_str else None

    def import_wbs_from_csv(self, file_content: str, project_id: str) -> Dict[str, Any]:
        """
        Import WBS items from CSV content

        Expected columns (Chinese):
        - 項目 (WBS ID) - required
        - 任務說明 (Task Name) - required
        - 父項目, 單位, 類別, 預計開始, 預計結束, etc.
        """
        try:
            # Parse CSV
            reader = csv.DictReader(StringIO(file_content))

            # Column mapping (Chinese to English)
            column_map = {
                '項目': 'wbs_id',
                '父項目': 'parent_id',
                '任務說明': 'task_name',
                '單位': 'owner_unit',
                '類別': 'category',
                '預計開始': 'original_planned_start',
                '預計結束': 'original_planned_end',
                '調整開始': 'revised_planned_start',
                '調整結束': 'revised_planned_end',
                '實際開始': 'actual_start_date',
                '實際結束': 'actual_end_date',
                '工作天數': 'work_days',
                '進度': 'actual_progress',
                '狀態': 'status',
                '備註': 'notes',
                '內部安排': 'is_internal',
            }

            imported = []
            failed = []

            for row_idx, row in enumerate(reader, start=2):
                try:
                    # Map columns
                    mapped_row = {}
                    for cn_col, en_col in column_map.items():
                        if cn_col in row:
                            mapped_row[en_col] = row[cn_col]

                    # Also try English column names directly
                    for en_col in column_map.values():
                        if en_col in row and en_col not in mapped_row:
                            mapped_row[en_col] = row[en_col]

                    # Check required fields
                    wbs_id = self._clean_string(mapped_row.get('wbs_id'))
                    task_name = self._clean_string(mapped_row.get('task_name'))

                    if not wbs_id:
                        continue

                    if not task_name:
                        task_name = wbs_id  # Use wbs_id as fallback

                    # Parse is_internal
                    is_internal_value = False
                    is_internal_str = self._clean_string(mapped_row.get('is_internal'))
                    if is_internal_str:
                        is_internal_value = is_internal_str.lower() in ['yes', 'y', 'true', '1', '是', 'v', '✓', 'x']

                    # Build WBS data
                    wbs_data = {
                        'project_id': project_id,
                        'wbs_id': wbs_id,
                        'parent_id': self._clean_parent_id(mapped_row.get('parent_id')),
                        'task_name': task_name,
                        'category': self._clean_string(mapped_row.get('category')) or 'Task',
                        'owner_unit': self._clean_string(mapped_row.get('owner_unit')),
                        'original_planned_start': self._parse_date(mapped_row.get('original_planned_start')),
                        'original_planned_end': self._parse_date(mapped_row.get('original_planned_end')),
                        'revised_planned_start': self._parse_date(mapped_row.get('revised_planned_start')),
                        'revised_planned_end': self._parse_date(mapped_row.get('revised_planned_end')),
                        'actual_start_date': self._parse_date(mapped_row.get('actual_start_date')),
                        'actual_end_date': self._parse_date(mapped_row.get('actual_end_date')),
                        'work_days': int(mapped_row['work_days']) if mapped_row.get('work_days') and mapped_row['work_days'].strip().isdigit() else None,
                        'actual_progress': int(mapped_row['actual_progress']) if mapped_row.get('actual_progress') and mapped_row['actual_progress'].strip().isdigit() else 0,
                        'status': self._clean_string(mapped_row.get('status')) or '未開始',
                        'notes': self._clean_string(mapped_row.get('notes')),
                        'is_internal': is_internal_value,
                    }

                    # Create WBS item
                    wbs_create = WBSCreate(**wbs_data)
                    self.wbs_service.create_wbs(wbs_create)

                    imported.append({
                        'row': row_idx,
                        'wbs_id': wbs_data['wbs_id'],
                        'task_name': wbs_data['task_name']
                    })

                except Exception as e:
                    failed.append({
                        'row': row_idx,
                        'wbs_id': row.get('項目', row.get('wbs_id', 'N/A')),
                        'error': str(e)
                    })

            return {
                'success': len(imported) > 0,
                'imported': len(imported),
                'failed': len(failed),
                'imported_items': imported,
                'failed_items': failed
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'imported': 0,
                'failed': 0
            }

    def export_wbs_to_csv(self, project_id: str) -> Dict[str, Any]:
        """
        Export WBS items to CSV string
        """
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute("""
                SELECT
                    wbs_id, parent_id, task_name, owner_unit, category,
                    original_planned_start, original_planned_end,
                    revised_planned_start, revised_planned_end,
                    actual_start_date, actual_end_date,
                    work_days, actual_progress, status, notes, is_internal, is_overdue
                FROM tracking_items
                WHERE project_id = ? AND item_type = 'WBS'
                ORDER BY wbs_id
            """, (project_id,))

            rows = cursor.fetchall()
            conn.close()

            if not rows:
                return {
                    'success': False,
                    'error': 'No WBS items found for this project',
                    'exported': 0
                }

            # Create CSV
            output = StringIO()
            headers = [
                '項目', '父項目', '任務說明', '單位', '類別',
                '預計開始', '預計結束', '調整開始', '調整結束',
                '實際開始', '實際結束', '工作天數', '進度',
                '狀態', '備註', '內部安排', '逾期'
            ]

            writer = csv.writer(output)
            writer.writerow(headers)

            for row in rows:
                writer.writerow([
                    row['wbs_id'],
                    row['parent_id'] or '',
                    row['task_name'],
                    row['owner_unit'] or '',
                    row['category'] or '',
                    row['original_planned_start'] or '',
                    row['original_planned_end'] or '',
                    row['revised_planned_start'] or '',
                    row['revised_planned_end'] or '',
                    row['actual_start_date'] or '',
                    row['actual_end_date'] or '',
                    row['work_days'] or '',
                    row['actual_progress'] or 0,
                    row['status'] or '',
                    row['notes'] or '',
                    'V' if row['is_internal'] else '',
                    '是' if row['is_overdue'] else '否'
                ])

            return {
                'success': True,
                'exported': len(rows),
                'content': output.getvalue()
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'exported': 0
            }

    def create_wbs_template(self) -> str:
        """
        Create WBS import template CSV
        """
        output = StringIO()
        headers = [
            '項目', '父項目', '任務說明', '單位', '類別',
            '預計開始', '預計結束', '調整開始', '調整結束',
            '實際開始', '實際結束', '工作天數', '進度',
            '狀態', '內部安排', '備註'
        ]

        sample_data = [
            ['1', '', '專案啟動', '專案經理', 'Milestone', '2024/01/01', '2024/01/01', '', '', '', '', '', '100', '已完成', '', '頂層項目範例'],
            ['1.1', '1', '需求分析', '開發部', 'Task', '2024/01/02', '2024/01/15', '', '', '2024/01/02', '2024/01/14', '10', '100', '已完成', '', '子項目範例'],
            ['1.2', '1', '系統設計', 'AAA', 'Task', '2024/01/16', '2024/01/31', '', '', '2024/01/16', '', '12', '60', '進行中', 'V', '內部安排範例'],
            ['2', '', '開發階段', '開發部', 'Milestone', '2024/02/01', '2024/03/31', '', '', '', '', '', '0', '未開始', '', '頂層項目範例'],
        ]

        writer = csv.writer(output)
        writer.writerow(headers)
        writer.writerows(sample_data)

        return output.getvalue()

    def export_pending_to_csv(self, project_id: str) -> Dict[str, Any]:
        """
        Export Pending items to CSV string
        """
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute("""
                SELECT
                    pending_id, task_date, source_type, contact_info, description,
                    expected_completion_date, is_replied, actual_completion_date,
                    handling_notes, related_wbs, status, priority
                FROM pending_items
                WHERE project_id = ?
                ORDER BY task_date DESC
            """, (project_id,))

            rows = cursor.fetchall()
            conn.close()

            if not rows:
                return {
                    'success': False,
                    'error': 'No pending items found',
                    'exported': 0
                }

            output = StringIO()
            headers = [
                '編號', '任務日期', '來源類型', '聯絡資訊', '說明',
                '預計回覆日期', '已回覆', '實際回覆日期',
                '處理備註', '相關WBS', '狀態', '優先級'
            ]

            writer = csv.writer(output)
            writer.writerow(headers)

            for row in rows:
                writer.writerow([
                    row['pending_id'],
                    row['task_date'] or '',
                    row['source_type'] or '',
                    row['contact_info'] or '',
                    row['description'] or '',
                    row['expected_completion_date'] or '',
                    '是' if row['is_replied'] else '否',
                    row['actual_completion_date'] or '',
                    row['handling_notes'] or '',
                    row['related_wbs'] or '',
                    row['status'] or '',
                    row['priority'] or ''
                ])

            return {
                'success': True,
                'exported': len(rows),
                'content': output.getvalue()
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'exported': 0
            }

    def export_issues_to_csv(self, project_id: str) -> Dict[str, Any]:
        """
        Export Issues to CSV string
        """
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute("""
                SELECT
                    issue_number, issue_title, issue_description,
                    issue_type, issue_category, severity, priority,
                    reported_by, reported_date, assigned_to,
                    status, resolution, target_resolution_date,
                    actual_resolution_date, is_escalated
                FROM issue_tracking
                WHERE project_id = ?
                ORDER BY issue_number
            """, (project_id,))

            rows = cursor.fetchall()
            conn.close()

            if not rows:
                return {
                    'success': False,
                    'error': 'No issues found',
                    'exported': 0
                }

            output = StringIO()
            headers = [
                '問題編號', '問題標題', '問題說明',
                '問題類型', '問題分類', '嚴重性', '優先級',
                '回報人', '回報日期', '指派給',
                '狀態', '解決方案', '目標解決日期',
                '實際解決日期', '已升級'
            ]

            writer = csv.writer(output)
            writer.writerow(headers)

            for row in rows:
                writer.writerow([
                    row['issue_number'] or '',
                    row['issue_title'] or '',
                    row['issue_description'] or '',
                    row['issue_type'] or '',
                    row['issue_category'] or '',
                    row['severity'] or '',
                    row['priority'] or '',
                    row['reported_by'] or '',
                    row['reported_date'] or '',
                    row['assigned_to'] or '',
                    row['status'] or '',
                    row['resolution'] or '',
                    row['target_resolution_date'] or '',
                    row['actual_resolution_date'] or '',
                    '是' if row['is_escalated'] else '否'
                ])

            return {
                'success': True,
                'exported': len(rows),
                'content': output.getvalue()
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'exported': 0
            }
