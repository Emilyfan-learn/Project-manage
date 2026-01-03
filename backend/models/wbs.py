"""
Pydantic models for WBS (Work Breakdown Structure) items
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


class WBSBase(BaseModel):
    """Base model for WBS items"""
    wbs_id: str = Field(..., description="WBS ID (e.g., 1, 2, 2.1, 2.2)")
    task_name: str = Field(..., description="Task name")
    category: str = Field(default="Task", description="Milestone or Task")

    # Responsibility
    owner_unit: Optional[str] = Field(None, description="Owner unit/department")
    owner_type: Optional[str] = Field(None, description="Client/Internal/Department")
    primary_owner: Optional[str] = None
    secondary_owner: Optional[str] = None

    # Schedule - Phase 1: Original Baseline
    original_planned_start: Optional[date] = None
    original_planned_end: Optional[date] = None

    # Schedule - Phase 2: Revised Plan
    revised_planned_start: Optional[date] = None
    revised_planned_end: Optional[date] = None

    # Schedule - Phase 3: Actual Execution
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    work_days: Optional[int] = None

    # Progress tracking
    actual_progress: int = Field(default=0, ge=0, le=100, description="Actual progress percentage")
    status: str = Field(default="未開始", description="未開始/進行中/已完成")

    # Notes and alerts
    notes: Optional[str] = None
    alert_flag: Optional[str] = None

    # Internal arrangement flag
    is_internal: bool = Field(default=False, description="Internal arrangement flag")


class WBSCreate(WBSBase):
    """Model for creating a new WBS item"""
    project_id: str = Field(..., description="Project ID")
    parent_id: Optional[str] = Field(None, description="Parent WBS ID")


class WBSUpdate(BaseModel):
    """Model for updating a WBS item"""
    parent_id: Optional[str] = None
    task_name: Optional[str] = None
    category: Optional[str] = None

    owner_unit: Optional[str] = None
    owner_type: Optional[str] = None
    primary_owner: Optional[str] = None
    secondary_owner: Optional[str] = None

    original_planned_start: Optional[date] = None
    original_planned_end: Optional[date] = None
    revised_planned_start: Optional[date] = None
    revised_planned_end: Optional[date] = None
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    work_days: Optional[int] = None

    actual_progress: Optional[int] = Field(None, ge=0, le=100)
    status: Optional[str] = None
    notes: Optional[str] = None
    alert_flag: Optional[str] = None
    is_internal: Optional[bool] = None


class WBSResponse(WBSBase):
    """Model for WBS response"""
    item_id: str
    project_id: str
    parent_id: Optional[str] = None
    item_type: str = "WBS"

    # Calculated fields
    estimated_progress: Optional[int] = None
    progress_variance: Optional[int] = None
    is_overdue: bool = False
    is_behind_schedule: bool = False  # True if progress_variance exceeds threshold

    # Metadata
    source: Optional[str] = "Manual"
    source_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WBSListResponse(BaseModel):
    """Model for WBS list response"""
    total: int
    items: list[WBSResponse]


class WBSTreeNode(WBSResponse):
    """Model for WBS tree structure"""
    children: list['WBSTreeNode'] = []
    level: int = 0


class WBSInsertBetween(BaseModel):
    """Model for inserting WBS between two items"""
    after_wbs: str = Field(..., description="Insert after this WBS ID")
    before_wbs: str = Field(..., description="Insert before this WBS ID")
    task_data: WBSCreate


class WBSRenumberResponse(BaseModel):
    """Response for WBS renumber operation"""
    success: bool
    new_wbs_id: str
    renumbered_count: int
    affected_items: list[str] = []
