"""
Pydantic models for Project management
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProjectBase(BaseModel):
    """Base model for projects"""
    project_name: str = Field(..., description="Project name")
    description: Optional[str] = Field(None, description="Project description")
    status: str = Field(default="Active", description="Active/Completed/On Hold/Cancelled")


class ProjectCreate(ProjectBase):
    """Model for creating a new project"""
    project_id: str = Field(..., description="Unique project ID")


class ProjectUpdate(BaseModel):
    """Model for updating a project"""
    project_name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class ProjectResponse(ProjectBase):
    """Model for project response"""
    project_id: str
    created_at: datetime
    updated_at: datetime

    # Statistics
    total_wbs: int = 0
    total_issues: int = 0
    total_pending: int = 0
    completed_wbs: int = 0
    in_progress_wbs: int = 0

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    """Model for project list response"""
    total: int
    items: list[ProjectResponse]


class ProjectStats(BaseModel):
    """Model for project statistics"""
    project_id: str
    project_name: str

    # WBS Statistics
    total_wbs: int
    completed_wbs: int
    in_progress_wbs: int
    not_started_wbs: int
    overdue_wbs: int

    # Issue Statistics
    total_issues: int
    open_issues: int
    resolved_issues: int
    critical_issues: int

    # Pending Items Statistics
    total_pending: int
    pending_replied: int
    pending_overdue: int

    # Overall Progress
    overall_progress: float = 0.0  # Average WBS progress
    health_status: str = "Healthy"  # Healthy/Warning/Critical
