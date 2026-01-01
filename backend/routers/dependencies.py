"""
API routes for Dependencies management
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from backend.models.dependency import (
    DependencyCreate,
    DependencyUpdate,
    DependencyResponse,
    DependencyListResponse,
    ScheduleImpactAnalysis
)
from backend.services.dependency_service import DependencyService

router = APIRouter()
dependency_service = DependencyService()


@router.post("/", response_model=DependencyResponse, status_code=201)
async def create_dependency(dep_data: DependencyCreate):
    """
    Create a new dependency relationship

    - **predecessor_id**: Item that must complete first
    - **successor_id**: Item that depends on predecessor
    - **dependency_type**: FS (Finish-to-Start) / SS / FF / SF
    - **lag_days**: Lag or lead time in days
    """
    try:
        return dependency_service.create_dependency(dep_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=DependencyListResponse)
async def get_dependencies_list(
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    item_id: Optional[str] = Query(None, description="Filter by item ID (predecessor or successor)"),
    active_only: bool = Query(True, description="Show only active dependencies"),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of items to return"),
):
    """
    Get list of dependencies with optional filters

    - **project_id**: Filter by project
    - **item_id**: Filter dependencies related to specific item
    - **active_only**: Show only active dependencies
    """
    items = dependency_service.get_dependencies_list(
        project_id=project_id,
        item_id=item_id,
        active_only=active_only,
        skip=skip,
        limit=limit
    )
    total = dependency_service.get_dependencies_count(
        project_id=project_id,
        item_id=item_id,
        active_only=active_only
    )

    return DependencyListResponse(total=total, items=items)


@router.get("/{dependency_id}", response_model=DependencyResponse)
async def get_dependency(dependency_id: int):
    """
    Get a specific dependency by ID
    """
    dependency = dependency_service.get_dependency_by_id(dependency_id)
    if not dependency:
        raise HTTPException(status_code=404, detail="Dependency not found")
    return dependency


@router.put("/{dependency_id}", response_model=DependencyResponse)
async def update_dependency(dependency_id: int, dep_update: DependencyUpdate):
    """
    Update a dependency

    Only provided fields will be updated. All fields are optional.
    """
    dependency = dependency_service.get_dependency_by_id(dependency_id)
    if not dependency:
        raise HTTPException(status_code=404, detail="Dependency not found")

    try:
        updated_dependency = dependency_service.update_dependency(dependency_id, dep_update)
        return updated_dependency
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{dependency_id}", status_code=204)
async def delete_dependency(dependency_id: int):
    """
    Delete a dependency
    """
    success = dependency_service.delete_dependency(dependency_id)
    if not success:
        raise HTTPException(status_code=404, detail="Dependency not found")


@router.get("/item/{item_id}/successors", response_model=List[DependencyResponse])
async def get_item_successors(item_id: str, active_only: bool = Query(True)):
    """
    Get all items that depend on this item (successors)
    """
    return dependency_service.get_successors(item_id, active_only=active_only)


@router.get("/item/{item_id}/predecessors", response_model=List[DependencyResponse])
async def get_item_predecessors(item_id: str, active_only: bool = Query(True)):
    """
    Get all items that this item depends on (predecessors)
    """
    return dependency_service.get_predecessors(item_id, active_only=active_only)


@router.post("/item/{item_id}/analyze-impact", response_model=ScheduleImpactAnalysis)
async def analyze_schedule_impact(item_id: str, date_changes: dict):
    """
    Analyze the impact of schedule changes on dependent items

    Returns suggested schedule adjustments for all affected items

    Example request body:
    ```json
    {
        "field": "revised_planned_end",
        "old_value": "2024-01-15",
        "new_value": "2024-01-25"
    }
    ```
    """
    try:
        analysis = dependency_service.analyze_schedule_impact(item_id, date_changes)
        return analysis
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
