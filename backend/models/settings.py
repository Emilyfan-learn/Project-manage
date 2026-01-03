"""
Pydantic models for system and project settings
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date


class SystemSettingBase(BaseModel):
    """Base model for system settings"""
    setting_key: str = Field(..., description="Setting key")
    setting_value: str = Field(..., description="Setting value")
    setting_type: str = Field(default="string", description="Type: string, number, boolean")
    description: Optional[str] = None


class SystemSettingCreate(SystemSettingBase):
    """Model for creating a system setting"""
    pass


class SystemSettingUpdate(BaseModel):
    """Model for updating a system setting"""
    setting_value: str


class SystemSettingResponse(SystemSettingBase):
    """Model for system setting response"""
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectSettingBase(BaseModel):
    """Base model for project settings"""
    project_id: str
    setting_key: str = Field(..., description="Setting key (e.g., 'owner_unit')")
    setting_value: str = Field(..., description="Setting value")
    display_order: int = Field(default=0, description="Display order in dropdown")
    is_active: bool = Field(default=True, description="Is this setting active")


class ProjectSettingCreate(ProjectSettingBase):
    """Model for creating a project setting"""
    pass


class ProjectSettingUpdate(BaseModel):
    """Model for updating a project setting"""
    setting_value: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class ProjectSettingResponse(ProjectSettingBase):
    """Model for project setting response"""
    setting_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OwnerUnitCreate(BaseModel):
    """Model for creating an owner unit"""
    project_id: str
    unit_name: str = Field(..., description="Owner unit name")
    display_order: int = Field(default=0, description="Display order")


class OwnerUnitResponse(BaseModel):
    """Model for owner unit response"""
    setting_id: int
    project_id: str
    unit_name: str
    display_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


# Holiday Models
class HolidayBase(BaseModel):
    """Base model for holidays"""
    year: int = Field(..., description="Year of the holiday")
    holiday_date: date = Field(..., description="Date of the holiday")
    holiday_name: str = Field(..., description="Name of the holiday")


class HolidayCreate(HolidayBase):
    """Model for creating a holiday"""
    pass


class HolidayUpdate(BaseModel):
    """Model for updating a holiday"""
    year: Optional[int] = None
    holiday_date: Optional[date] = None
    holiday_name: Optional[str] = None


class HolidayResponse(HolidayBase):
    """Model for holiday response"""
    holiday_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HolidayListResponse(BaseModel):
    """Model for holiday list response"""
    total: int
    items: List[HolidayResponse]
