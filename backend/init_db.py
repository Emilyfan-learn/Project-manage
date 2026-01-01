"""
Database initialization script with schema definitions
"""
import sqlite3
import sys
from pathlib import Path

# Add project root to path to support running from anywhere
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from backend.config import settings


def create_database_schema():
    """
    Create all database tables based on the specification
    """
    # Ensure data directory exists
    settings.database_path.parent.mkdir(parents=True, exist_ok=True)

    # Connect to database
    conn = sqlite3.connect(str(settings.database_path))
    cursor = conn.cursor()

    # 1. Projects table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            project_id TEXT PRIMARY KEY,
            project_name TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 2. Core tracking items table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tracking_items (
            -- Unique identification
            item_id TEXT PRIMARY KEY,
            project_id TEXT,

            -- WBS structure
            wbs_id TEXT,
            parent_id TEXT,
            task_name TEXT,
            item_type TEXT,
            category TEXT,

            -- Responsibility
            owner_unit TEXT,
            owner_type TEXT,
            primary_owner TEXT,
            secondary_owner TEXT,

            -- Schedule management (3 phases)
            -- Phase 1: Original Baseline
            original_planned_start DATE,
            original_planned_end DATE,

            -- Phase 2: Revised Plan
            revised_planned_start DATE,
            revised_planned_end DATE,

            -- Phase 3: Actual Execution
            actual_start_date DATE,
            actual_end_date DATE,
            work_days INTEGER,

            -- Progress tracking
            actual_progress INTEGER,
            estimated_progress INTEGER,
            progress_variance INTEGER,

            -- Status management
            status TEXT,
            is_overdue BOOLEAN,

            -- Notes and alerts
            notes TEXT,
            alert_flag TEXT,

            -- Internal arrangement flag
            is_internal BOOLEAN DEFAULT 0,

            -- Source tracking
            source TEXT,
            source_date DATE,
            source_reference TEXT,

            -- System fields
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (project_id) REFERENCES projects(project_id)
        )
    """)

    # 3. Item dependencies table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS item_dependencies (
            dependency_id INTEGER PRIMARY KEY AUTOINCREMENT,

            -- Dependency relationship
            predecessor_id TEXT,
            successor_id TEXT,

            -- Dependency type
            dependency_type TEXT,
            lag_days INTEGER DEFAULT 0,

            -- Impact assessment
            impact_level TEXT,
            impact_description TEXT,

            -- Status
            is_active BOOLEAN DEFAULT 1,

            -- System fields
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (predecessor_id) REFERENCES tracking_items(item_id),
            FOREIGN KEY (successor_id) REFERENCES tracking_items(item_id)
        )
    """)

    # 4. Schedule changes history table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS schedule_changes (
            change_id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id TEXT,

            -- Change information
            change_date TIMESTAMP,
            change_by TEXT,
            change_type TEXT,
            change_reason TEXT,

            -- Before/After comparison
            old_start_date DATE,
            old_end_date DATE,
            new_start_date DATE,
            new_end_date DATE,

            -- Impact analysis
            affected_items_count INTEGER,
            affected_items TEXT,
            impact_summary TEXT,

            FOREIGN KEY (item_id) REFERENCES tracking_items(item_id)
        )
    """)

    # 5. Pending items management table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pending_items (
            pending_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT,

            -- Basic information
            task_date DATE,
            source_type TEXT,
            contact_info TEXT,
            description TEXT,

            -- Schedule tracking
            expected_reply_date DATE,
            is_replied BOOLEAN DEFAULT 0,
            actual_reply_date DATE,

            -- Handling information
            handling_notes TEXT,

            -- Related information
            related_wbs TEXT,
            related_action_item TEXT,
            related_issue_id INTEGER,

            -- Status and priority
            status TEXT DEFAULT '待處理',
            priority TEXT,

            -- System fields
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (project_id) REFERENCES projects(project_id),
            FOREIGN KEY (related_issue_id) REFERENCES issue_tracking(issue_id)
        )
    """)

    # 6. Issue tracking table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS issue_tracking (
            issue_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT,

            -- Issue identification
            issue_number TEXT,
            issue_title TEXT NOT NULL,
            issue_description TEXT,

            -- Classification
            issue_type TEXT,
            issue_category TEXT,

            -- Severity and priority
            severity TEXT,
            priority TEXT,

            -- Responsibility
            reported_by TEXT,
            reported_date DATE,
            assigned_to TEXT,
            owner_type TEXT,

            -- Impact scope
            affected_wbs TEXT,
            impact_description TEXT,
            estimated_impact_days INTEGER,

            -- Status tracking
            status TEXT DEFAULT 'Open',
            resolution TEXT,
            root_cause TEXT,

            -- Schedule
            target_resolution_date DATE,
            actual_resolution_date DATE,
            closed_date DATE,

            -- Escalation and tracking
            is_escalated BOOLEAN DEFAULT 0,
            escalation_level TEXT,
            escalation_date DATE,
            escalation_reason TEXT,

            -- Communication log
            communication_log TEXT,

            -- Source tracking
            source TEXT,
            source_reference_id INTEGER,

            -- Attachments and references
            attachments TEXT,
            related_issues TEXT,

            -- System fields
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (project_id) REFERENCES projects(project_id)
        )
    """)

    # 7. Issue status history table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS issue_status_history (
            history_id INTEGER PRIMARY KEY AUTOINCREMENT,
            issue_id INTEGER,

            -- Status change
            old_status TEXT,
            new_status TEXT,
            change_date TIMESTAMP,
            changed_by TEXT,
            change_reason TEXT,

            -- Field changes (optional)
            field_name TEXT,
            old_value TEXT,
            new_value TEXT,

            notes TEXT,

            FOREIGN KEY (issue_id) REFERENCES issue_tracking(issue_id)
        )
    """)

    # 8. Pending replies table (for tracking multiple replies to pending items)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pending_replies (
            reply_id INTEGER PRIMARY KEY AUTOINCREMENT,
            pending_id INTEGER NOT NULL,
            reply_date DATE NOT NULL,
            reply_content TEXT,
            replied_by TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (pending_id) REFERENCES pending_items(pending_id) ON DELETE CASCADE
        )
    """)

    # 9. Notifications table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            notification_id INTEGER PRIMARY KEY AUTOINCREMENT,

            -- Notification type
            notification_type TEXT,

            -- Related item
            related_item_id TEXT,
            related_item_type TEXT,

            -- Message
            title TEXT,
            message TEXT,

            -- Status
            is_read BOOLEAN DEFAULT 0,
            is_dismissed BOOLEAN DEFAULT 0,

            -- Priority
            priority TEXT DEFAULT 'Medium',

            -- System fields
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read_at TIMESTAMP,
            dismissed_at TIMESTAMP
        )
    """)

    # Create indexes for better query performance
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tracking_items_project ON tracking_items(project_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tracking_items_wbs ON tracking_items(wbs_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tracking_items_status ON tracking_items(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_dependencies_predecessor ON item_dependencies(predecessor_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_dependencies_successor ON item_dependencies(successor_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_dependencies_active ON item_dependencies(is_active)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_pending_items_project ON pending_items(project_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_pending_items_status ON pending_items(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_pending_replies_pending_id ON pending_replies(pending_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_pending_replies_reply_date ON pending_replies(reply_date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_issue_tracking_project ON issue_tracking(project_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_issue_tracking_status ON issue_tracking(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)")

    # Commit changes
    conn.commit()
    conn.close()

    print("✓ Database schema created successfully")
    print(f"✓ Database location: {settings.database_path}")


if __name__ == "__main__":
    create_database_schema()
