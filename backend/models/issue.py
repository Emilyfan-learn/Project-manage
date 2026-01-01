"""
Pydantic models for Issue Tracking
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


class IssueBase(BaseModel):
    """Base model for issues"""
    issue_title: str = Field(..., description="Issue title")
    issue_description: Optional[str] = Field(None, description="Issue description")

    # Classification
    issue_type: str = Field(..., description="技術問題/需求問題/資源問題/時程問題/其他")
    issue_category: str = Field(..., description="阻礙者/風險/變更請求/缺陷")

    # Severity and Priority
    severity: str = Field(..., description="Critical/High/Medium/Low")
    priority: str = Field(..., description="Urgent/High/Medium/Low")

    # Responsibility
    reported_by: str = Field(..., description="Reporter name")
    assigned_to: Optional[str] = Field(None, description="Assignee")
    owner_type: Optional[str] = Field(None, description="客戶/內部/廠商")

    # Impact
    affected_wbs: Optional[str] = Field(None, description="Affected WBS IDs (comma separated)")
    impact_description: Optional[str] = Field(None, description="Impact description")
    estimated_impact_days: Optional[int] = Field(None, description="Estimated impact in days")

    # Status
    status: str = Field(default="Open", description="Open/In Progress/Pending/Resolved/Closed/Cancelled")
    resolution: Optional[str] = Field(None, description="Resolution description")
    root_cause: Optional[str] = Field(None, description="Root cause analysis")

    # Schedule
    target_resolution_date: Optional[date] = Field(None, description="Target resolution date")


class IssueCreate(IssueBase):
    """Model for creating a new issue"""
    project_id: str = Field(..., description="Project ID")
    reported_date: date = Field(default_factory=date.today, description="Reported date")
    source: str = Field(default="Manual", description="Pending Item/Meeting/Manual/Customer Report")
    source_reference_id: Optional[int] = Field(None, description="Source reference ID")


class IssueUpdate(BaseModel):
    """Model for updating an issue"""
    issue_title: Optional[str] = None
    issue_description: Optional[str] = None

    issue_type: Optional[str] = None
    issue_category: Optional[str] = None

    severity: Optional[str] = None
    priority: Optional[str] = None

    assigned_to: Optional[str] = None
    owner_type: Optional[str] = None

    affected_wbs: Optional[str] = None
    impact_description: Optional[str] = None
    estimated_impact_days: Optional[int] = None

    status: Optional[str] = None
    resolution: Optional[str] = None
    root_cause: Optional[str] = None

    target_resolution_date: Optional[date] = None
    actual_resolution_date: Optional[date] = None
    closed_date: Optional[date] = None

    is_escalated: Optional[bool] = None
    escalation_level: Optional[str] = None
    escalation_reason: Optional[str] = None


class IssueResponse(IssueBase):
    """Model for issue response"""
    issue_id: int
    project_id: str
    issue_number: str

    reported_date: date
    actual_resolution_date: Optional[date] = None
    closed_date: Optional[date] = None

    # Escalation
    is_escalated: bool = False
    escalation_level: Optional[str] = None
    escalation_date: Optional[date] = None
    escalation_reason: Optional[str] = None

    # Source
    source: str
    source_reference_id: Optional[int] = None

    # Calculated fields
    is_overdue: bool = False
    days_open: int = 0

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IssueListResponse(BaseModel):
    """Model for issue list response"""
    total: int
    items: List[IssueResponse]


class IssueStatusHistory(BaseModel):
    """Model for issue status history"""
    history_id: int
    issue_id: int
    old_status: Optional[str]
    new_status: str
    change_date: datetime
    changed_by: str
    change_reason: Optional[str]
    notes: Optional[str]

    class Config:
        from_attributes = True


class IssueStats(BaseModel):
    """Model for issue statistics"""
    total: int
    open: int
    in_progress: int
    pending: int
    resolved: int
    closed: int
    cancelled: int

    critical: int
    high_severity: int
    medium_severity: int
    low_severity: int

    escalated: int
    overdue: int

    by_type: dict
    by_category: dict
    by_owner: dict

    avg_resolution_days: float = 0.0


class EscalateIssue(BaseModel):
    """Model for escalating an issue"""
    escalation_level: str = Field(..., description="PM/Senior Manager/Executive")
    escalation_reason: str = Field(..., description="Reason for escalation")
    changed_by: str = Field(..., description="Person who escalated")


class ResolveIssue(BaseModel):
    """Model for resolving an issue"""
    resolution: str = Field(..., description="Resolution description")
    root_cause: Optional[str] = Field(None, description="Root cause analysis")
    resolved_by: str = Field(..., description="Person who resolved")
