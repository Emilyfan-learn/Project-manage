"""
Pydantic models for Item Dependencies management
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date


class DependencyBase(BaseModel):
    """Base model for dependencies"""
    predecessor_id: str = Field(..., description="Item that must complete first")
    successor_id: str = Field(..., description="Item that depends on predecessor")
    dependency_type: str = Field(default="FS", description="FS/SS/FF/SF")
    lag_days: int = Field(default=0, description="Lag/Lead time in days")
    impact_level: Optional[str] = Field(default="Medium", description="Critical/High/Medium/Low")
    impact_description: Optional[str] = Field(None, description="Description of impact")
    is_active: bool = Field(default=True, description="Whether dependency is active")


class DependencyCreate(DependencyBase):
    """Model for creating a new dependency"""
    pass


class DependencyUpdate(BaseModel):
    """Model for updating a dependency"""
    dependency_type: Optional[str] = None
    lag_days: Optional[int] = None
    impact_level: Optional[str] = None
    impact_description: Optional[str] = None
    is_active: Optional[bool] = None


class DependencyResponse(DependencyBase):
    """Model for dependency response"""
    dependency_id: int
    created_at: datetime
    updated_at: datetime

    # Additional fields with item details
    predecessor_wbs_id: Optional[str] = None
    predecessor_task_name: Optional[str] = None
    successor_wbs_id: Optional[str] = None
    successor_task_name: Optional[str] = None

    class Config:
        from_attributes = True


class DependencyListResponse(BaseModel):
    """Model for dependency list response"""
    total: int
    items: List[DependencyResponse]


class ScheduleAdjustmentSuggestion(BaseModel):
    """Model for schedule adjustment suggestion"""
    item_id: str
    wbs_id: str
    task_name: str
    current_start: Optional[date]
    current_end: Optional[date]
    suggested_start: Optional[date]
    suggested_end: Optional[date]
    delay_days: int
    reason: str
    dependency_chain: List[str] = []


class ScheduleImpactAnalysis(BaseModel):
    """Model for schedule impact analysis"""
    source_item_id: str
    source_wbs_id: str
    source_task_name: str
    date_change: dict  # {'field': 'end_date', 'old': '2024-01-01', 'new': '2024-01-15'}
    affected_items: List[ScheduleAdjustmentSuggestion]
    total_affected: int
    critical_path_affected: bool
