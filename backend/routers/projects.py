"""
API routes for Project management
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.models.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
    ProjectStats,
)
from backend.services.project_service import ProjectService

router = APIRouter()
project_service = ProjectService()


@router.post("/", response_model=ProjectResponse, status_code=201)
async def create_project(project_data: ProjectCreate):
    """
    Create a new project

    - **project_id**: Unique project identifier (e.g., PRJ001, PRJ002)
    - **project_name**: Project name
    - **description**: Project description (optional)
    - **status**: Active/Completed/On Hold/Cancelled (default: Active)
    """
    try:
        return project_service.create_project(project_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=ProjectListResponse)
async def get_project_list(
    status: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of items to return"),
):
    """
    Get list of projects with optional filters

    - **status**: Filter by status (Active/Completed/On Hold/Cancelled)
    - **skip**: Pagination offset
    - **limit**: Number of items per page
    """
    try:
        items = project_service.get_project_list(
            status=status,
            skip=skip,
            limit=limit
        )
        total = project_service.get_project_count(status=status)

        return ProjectListResponse(total=total, items=items)
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database not initialized: {str(e)}. Please run database initialization."
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    """
    Get a specific project by ID with statistics

    - **project_id**: Project identifier
    """
    project = project_service.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/{project_id}/stats", response_model=ProjectStats)
async def get_project_statistics(project_id: str):
    """
    Get detailed statistics for a project

    Returns comprehensive statistics including:
    - WBS progress and status breakdown
    - Issue tracking metrics
    - Pending items status
    - Overall health status
    """
    stats = project_service.get_project_stats(project_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Project not found")
    return stats


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, project_update: ProjectUpdate):
    """
    Update a project

    Only provided fields will be updated. All fields are optional.
    """
    project = project_service.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        updated_project = project_service.update_project(project_id, project_update)
        return updated_project
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: str):
    """
    Delete a project

    ⚠️ WARNING: This will also delete all related data including:
    - All WBS items
    - All issues
    - All pending items

    This operation cannot be undone.
    """
    success = project_service.delete_project(project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
