"""
API routes for system and project settings
"""
from fastapi import APIRouter, HTTPException
from typing import List
from backend.services.settings_service import SettingsService
from backend.models.settings import (
    SystemSettingResponse, SystemSettingUpdate,
    ProjectSettingResponse, ProjectSettingCreate, ProjectSettingUpdate,
    OwnerUnitCreate, OwnerUnitResponse
)

router = APIRouter()
settings_service = SettingsService()


# ==================== System Settings ====================

@router.get("/system", response_model=List[SystemSettingResponse])
async def get_all_system_settings():
    """Get all system settings"""
    return settings_service.get_all_system_settings()


@router.get("/system/{setting_key}", response_model=SystemSettingResponse)
async def get_system_setting(setting_key: str):
    """Get a specific system setting"""
    setting = settings_service.get_system_setting(setting_key)
    if not setting:
        raise HTTPException(status_code=404, detail=f"Setting '{setting_key}' not found")
    return setting


@router.put("/system/{setting_key}", response_model=SystemSettingResponse)
async def update_system_setting(setting_key: str, update_data: SystemSettingUpdate):
    """Update a system setting"""
    setting = settings_service.update_system_setting(setting_key, update_data)
    if not setting:
        raise HTTPException(status_code=404, detail=f"Setting '{setting_key}' not found")
    return setting


# ==================== Project Settings ====================

@router.get("/project/{project_id}", response_model=List[ProjectSettingResponse])
async def get_project_settings(project_id: str, setting_key: str = None):
    """Get project settings (optionally filtered by key)"""
    return settings_service.get_project_settings(project_id, setting_key)


@router.post("/project", response_model=ProjectSettingResponse)
async def create_project_setting(setting_data: ProjectSettingCreate):
    """Create a new project setting"""
    try:
        return settings_service.create_project_setting(setting_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/project/{setting_id}", response_model=ProjectSettingResponse)
async def update_project_setting(setting_id: int, update_data: ProjectSettingUpdate):
    """Update a project setting"""
    setting = settings_service.update_project_setting(setting_id, update_data)
    if not setting:
        raise HTTPException(status_code=404, detail=f"Setting ID {setting_id} not found")
    return setting


@router.delete("/project/{setting_id}")
async def delete_project_setting(setting_id: int):
    """Delete a project setting (soft delete)"""
    success = settings_service.delete_project_setting(setting_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Setting ID {setting_id} not found")
    return {"success": True, "message": "Setting deleted successfully"}


# ==================== Owner Units (Convenience endpoints) ====================

@router.get("/owner-units/{project_id}", response_model=List[str])
async def get_owner_units(project_id: str):
    """Get list of owner units for a project"""
    return settings_service.get_owner_units(project_id)


@router.post("/owner-units", response_model=ProjectSettingResponse)
async def add_owner_unit(data: OwnerUnitCreate):
    """Add an owner unit to a project"""
    try:
        return settings_service.add_owner_unit(
            data.project_id,
            data.unit_name,
            data.display_order
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
