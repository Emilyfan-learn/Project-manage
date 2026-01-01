"""
Pydantic models for Pending Items management
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


class PendingBase(BaseModel):
    """Base model for pending items"""
    task_date: date = Field(..., description="Task date")
    source_type: str = Field(..., description="Source type: 客戶/自己/內部")
    contact_info: Optional[str] = Field(None, description="Contact information")
    description: str = Field(..., description="Task description")

    planned_start_date: Optional[date] = Field(None, description="預計開始日期")
    expected_completion_date: Optional[date] = Field(None, description="預計完成日期")
    handling_notes: Optional[str] = Field(None, description="Handling notes")

    related_wbs: Optional[str] = Field(None, description="Related WBS ID")
    related_action_item: Optional[str] = Field(None, description="Related action item")
    related_issue_id: Optional[int] = Field(None, description="Related issue ID")

    status: str = Field(default="待處理", description="待處理/處理中/已完成/已取消")
    priority: Optional[str] = Field(None, description="High/Medium/Low")


class PendingCreate(PendingBase):
    """Model for creating a new pending item"""
    project_id: str = Field(..., description="Project ID")


class PendingUpdate(BaseModel):
    """Model for updating a pending item"""
    task_date: Optional[date] = None
    source_type: Optional[str] = None
    contact_info: Optional[str] = None
    description: Optional[str] = None

    planned_start_date: Optional[date] = None
    expected_completion_date: Optional[date] = None
    is_replied: Optional[bool] = None
    actual_completion_date: Optional[date] = None
    handling_notes: Optional[str] = None

    related_wbs: Optional[str] = None
    related_action_item: Optional[str] = None
    related_issue_id: Optional[int] = None

    status: Optional[str] = None
    priority: Optional[str] = None


class PendingResponse(PendingBase):
    """Model for pending item response"""
    pending_id: int
    project_id: str

    is_replied: bool = False
    actual_completion_date: Optional[date] = None

    # Calculated fields
    is_overdue: bool = False
    days_until_due: Optional[int] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PendingListResponse(BaseModel):
    """Model for pending list response"""
    total: int
    items: list[PendingResponse]


class PendingStats(BaseModel):
    """Model for pending items statistics"""
    total: int
    pending: int  # 待處理
    in_progress: int  # 處理中
    completed: int  # 已完成
    cancelled: int  # 已取消

    replied: int  # 已回覆
    not_replied: int  # 未回覆
    overdue: int  # 逾期

    high_priority: int
    medium_priority: int
    low_priority: int

    by_source: dict  # 按來源統計


class PendingReplyCreate(BaseModel):
    """Model for creating a pending reply"""
    reply_content: Optional[str] = Field(None, description="Reply content")
    replied_by: str = Field(..., description="Person who replied")
    reply_date: date = Field(default_factory=date.today, description="Reply date")


class PendingReplyResponse(BaseModel):
    """Model for pending reply response"""
    reply_id: int
    pending_id: int
    reply_date: date
    reply_content: Optional[str] = None
    replied_by: str
    created_at: datetime

    class Config:
        from_attributes = True


class PendingWithReplies(PendingResponse):
    """Model for pending item with reply history"""
    replies: List[PendingReplyResponse] = []
    reply_count: int = 0
