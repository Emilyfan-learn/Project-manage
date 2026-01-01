"""
API routes for Pending Items management
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from backend.models.pending import (
    PendingCreate,
    PendingUpdate,
    PendingResponse,
    PendingListResponse,
    PendingStats,
    PendingReplyCreate,
    PendingReplyResponse,
    PendingWithReplies,
)
from backend.services.pending_service import PendingService

router = APIRouter()
pending_service = PendingService()


@router.post("/", response_model=PendingResponse, status_code=201)
async def create_pending(pending_data: PendingCreate):
    """
    Create a new pending item

    - **project_id**: Project ID
    - **task_date**: Task date
    - **source_type**: Source type (客戶/自己/內部)
    - **description**: Task description
    - **expected_reply_date**: Expected reply date (optional)
    - **priority**: Priority level (High/Medium/Low)
    """
    try:
        return pending_service.create_pending(pending_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=PendingListResponse)
async def get_pending_list(
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    source_type: Optional[str] = Query(None, description="Filter by source type"),
    is_replied: Optional[bool] = Query(None, description="Filter by reply status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of items to return"),
):
    """
    Get list of pending items with optional filters

    - **project_id**: Filter by project
    - **status**: Filter by status (待處理/處理中/已完成/已取消)
    - **source_type**: Filter by source (客戶/自己/內部)
    - **is_replied**: Filter by reply status
    - **priority**: Filter by priority (High/Medium/Low)
    - **skip**: Pagination offset
    - **limit**: Number of items per page
    """
    items = pending_service.get_pending_list(
        project_id=project_id,
        status=status,
        source_type=source_type,
        is_replied=is_replied,
        priority=priority,
        skip=skip,
        limit=limit
    )
    total = pending_service.get_pending_count(
        project_id=project_id,
        status=status,
        source_type=source_type,
        is_replied=is_replied,
        priority=priority
    )

    return PendingListResponse(total=total, items=items)


@router.get("/stats", response_model=PendingStats)
async def get_pending_statistics(
    project_id: Optional[str] = Query(None, description="Filter by project ID")
):
    """
    Get pending items statistics

    Returns comprehensive statistics including:
    - Status breakdown (待處理/處理中/已完成/已取消)
    - Reply status (已回覆/未回覆/逾期)
    - Priority distribution
    - Source breakdown
    """
    return pending_service.get_pending_stats(project_id=project_id)


@router.get("/overdue", response_model=List[PendingResponse])
async def get_overdue_items(
    project_id: Optional[str] = Query(None, description="Filter by project ID")
):
    """
    Get all overdue pending items

    Returns items where expected_reply_date < today and is_replied = false
    """
    return pending_service.get_overdue_items(project_id=project_id)


@router.get("/{pending_id}", response_model=PendingResponse)
async def get_pending(pending_id: int):
    """
    Get a specific pending item by ID
    """
    pending = pending_service.get_pending_by_id(pending_id)
    if not pending:
        raise HTTPException(status_code=404, detail="Pending item not found")
    return pending


@router.put("/{pending_id}", response_model=PendingResponse)
async def update_pending(pending_id: int, pending_update: PendingUpdate):
    """
    Update a pending item

    Only provided fields will be updated. All fields are optional.
    """
    pending = pending_service.get_pending_by_id(pending_id)
    if not pending:
        raise HTTPException(status_code=404, detail="Pending item not found")

    try:
        updated_pending = pending_service.update_pending(pending_id, pending_update)
        return updated_pending
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{pending_id}/reply", response_model=PendingResponse)
async def mark_as_replied(pending_id: int):
    """
    Mark a pending item as replied

    Sets is_replied=true, actual_reply_date=today, status='已完成'
    """
    pending = pending_service.get_pending_by_id(pending_id)
    if not pending:
        raise HTTPException(status_code=404, detail="Pending item not found")

    try:
        updated_pending = pending_service.mark_as_replied(pending_id)
        return updated_pending
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{pending_id}", status_code=204)
async def delete_pending(pending_id: int):
    """
    Delete a pending item
    """
    success = pending_service.delete_pending(pending_id)
    if not success:
        raise HTTPException(status_code=404, detail="Pending item not found")


@router.post("/{pending_id}/replies", response_model=PendingReplyResponse, status_code=201)
async def add_reply(pending_id: int, reply_data: PendingReplyCreate):
    """
    Add a reply to a pending item
    
    - **reply_content**: Reply content (optional)
    - **replied_by**: Person who replied
    - **reply_date**: Reply date (defaults to today)
    """
    try:
        return pending_service.add_reply(pending_id, reply_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{pending_id}/replies", response_model=List[PendingReplyResponse])
async def get_replies(pending_id: int):
    """
    Get all replies for a pending item
    
    Returns list of replies ordered by date (newest first)
    """
    try:
        return pending_service.get_replies(pending_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{pending_id}/with-replies", response_model=PendingWithReplies)
async def get_pending_with_replies(pending_id: int):
    """
    Get a pending item with all its reply history
    
    Returns the pending item along with all replies
    """
    pending_with_replies = pending_service.get_pending_with_replies(pending_id)
    if not pending_with_replies:
        raise HTTPException(status_code=404, detail="Pending item not found")
    return pending_with_replies
