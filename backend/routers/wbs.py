"""
API routes for WBS (Work Breakdown Structure) management
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from backend.models.wbs import (
    WBSCreate,
    WBSUpdate,
    WBSResponse,
    WBSListResponse,
)
from backend.services.wbs_service import WBSService

router = APIRouter()
wbs_service = WBSService()


@router.post("/", response_model=WBSResponse, status_code=201)
async def create_wbs(wbs_data: WBSCreate):
    """
    Create a new WBS item

    - **project_id**: Project ID
    - **wbs_id**: WBS identifier (e.g., 1, 2.1, 2.1.3)
    - **task_name**: Task name/description
    - **category**: Milestone or Task
    - **owner_unit**: Responsible unit/department
    - All date fields are optional
    """
    try:
        return wbs_service.create_wbs(wbs_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=WBSListResponse)
async def get_wbs_list(
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    include_internal: bool = Query(True, description="Include internal items"),
    exclude_completed: bool = Query(False, description="Exclude completed/cancelled items"),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=10000, description="Number of items to return"),
):
    """
    Get list of WBS items with optional filters

    - **project_id**: Filter by project
    - **status**: Filter by status (未開始/進行中/已完成)
    - **include_internal**: Include internal arrangement items (default: true)
    - **exclude_completed**: Exclude completed/cancelled items (default: false)
    - **skip**: Pagination offset
    - **limit**: Number of items per page
    """
    items = wbs_service.get_wbs_list(
        project_id=project_id,
        status=status,
        skip=skip,
        limit=limit,
        include_internal=include_internal,
        exclude_completed=exclude_completed
    )
    total = wbs_service.get_wbs_count(project_id=project_id)

    return WBSListResponse(total=total, items=items)


@router.get("/tree/{project_id}")
async def get_wbs_tree(
    project_id: str,
    include_internal: bool = Query(True, description="Include internal items"),
    exclude_completed: bool = Query(False, description="Exclude completed/cancelled items"),
):
    """
    Get WBS items in tree structure for a project

    Returns hierarchical tree based on parent-child relationships
    - **include_internal**: Include internal arrangement items (default: true)
    - **exclude_completed**: Exclude completed/cancelled items (default: false)
    """
    try:
        tree = wbs_service.get_wbs_tree(
            project_id,
            include_internal=include_internal,
            exclude_completed=exclude_completed
        )
        return {"project_id": project_id, "tree": tree}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{item_id}", response_model=WBSResponse)
async def get_wbs(item_id: str):
    """
    Get a specific WBS item by ID

    - **item_id**: Format: {project_id}_{wbs_id}
    """
    wbs = wbs_service.get_wbs_by_id(item_id)
    if not wbs:
        raise HTTPException(status_code=404, detail="WBS item not found")
    return wbs


@router.put("/{item_id}", response_model=WBSResponse)
async def update_wbs(item_id: str, wbs_update: WBSUpdate):
    """
    Update a WBS item

    Only provided fields will be updated. All fields are optional.
    """
    wbs = wbs_service.get_wbs_by_id(item_id)
    if not wbs:
        raise HTTPException(status_code=404, detail="WBS item not found")

    try:
        updated_wbs = wbs_service.update_wbs(item_id, wbs_update)
        return updated_wbs
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{item_id}", status_code=204)
async def delete_wbs(item_id: str):
    """
    Delete a WBS item

    This will also delete all related dependencies.
    """
    success = wbs_service.delete_wbs(item_id)
    if not success:
        raise HTTPException(status_code=404, detail="WBS item not found")


@router.get("/{item_id}/children", response_model=List[WBSResponse])
async def get_wbs_children(item_id: str):
    """
    Get all direct children of a WBS item
    """
    wbs = wbs_service.get_wbs_by_id(item_id)
    if not wbs:
        raise HTTPException(status_code=404, detail="WBS item not found")

    children = wbs_service.get_children(item_id)
    return children


@router.post("/batch", response_model=List[WBSResponse])
async def create_wbs_batch(wbs_items: List[WBSCreate]):
    """
    Create multiple WBS items in batch

    Useful for importing from Excel or bulk operations
    """
    created_items = []
    errors = []

    for idx, wbs_data in enumerate(wbs_items):
        try:
            item = wbs_service.create_wbs(wbs_data)
            created_items.append(item)
        except Exception as e:
            errors.append({"index": idx, "wbs_id": wbs_data.wbs_id, "error": str(e)})

    if errors and not created_items:
        raise HTTPException(status_code=400, detail={"message": "All items failed", "errors": errors})

    # Return created items even if some failed
    return created_items
