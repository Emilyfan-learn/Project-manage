"""
API routes for Issue Tracking
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from backend.models.issue import (
    IssueCreate,
    IssueUpdate,
    IssueResponse,
    IssueListResponse,
    IssueStats,
    IssueStatusHistory,
    EscalateIssue,
    ResolveIssue,
)
from backend.services.issue_service import IssueService

router = APIRouter()
issue_service = IssueService()


@router.post("/", response_model=IssueResponse, status_code=201)
async def create_issue(issue_data: IssueCreate):
    """
    Create a new issue

    - **project_id**: Project ID
    - **issue_title**: Issue title
    - **issue_type**: 技術問題/需求問題/資源問題/時程問題/其他
    - **issue_category**: 阻礙者/風險/變更請求/缺陷
    - **severity**: Critical/High/Medium/Low
    - **priority**: Urgent/High/Medium/Low
    - **reported_by**: Reporter name
    """
    try:
        return issue_service.create_issue(issue_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=IssueListResponse)
async def get_issue_list(
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    issue_type: Optional[str] = Query(None, description="Filter by issue type"),
    assigned_to: Optional[str] = Query(None, description="Filter by assignee"),
    is_escalated: Optional[bool] = Query(None, description="Filter by escalation status"),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of items to return"),
):
    """
    Get list of issues with optional filters

    Filters:
    - **project_id**: Project ID
    - **status**: Open/In Progress/Pending/Resolved/Closed/Cancelled
    - **severity**: Critical/High/Medium/Low
    - **priority**: Urgent/High/Medium/Low
    - **issue_type**: Issue type
    - **assigned_to**: Assignee name
    - **is_escalated**: Escalation status
    """
    items = issue_service.get_issue_list(
        project_id=project_id,
        status=status,
        severity=severity,
        priority=priority,
        issue_type=issue_type,
        assigned_to=assigned_to,
        is_escalated=is_escalated,
        skip=skip,
        limit=limit
    )
    total = issue_service.get_issue_count(
        project_id=project_id,
        status=status,
        severity=severity,
        priority=priority,
        issue_type=issue_type,
        assigned_to=assigned_to,
        is_escalated=is_escalated
    )

    return IssueListResponse(total=total, items=items)


@router.get("/stats", response_model=IssueStats)
async def get_issue_statistics(
    project_id: Optional[str] = Query(None, description="Filter by project ID")
):
    """
    Get issue statistics

    Returns comprehensive statistics including:
    - Status breakdown
    - Severity distribution
    - Escalation metrics
    - Type and category breakdown
    - Average resolution time
    """
    return issue_service.get_issue_stats(project_id=project_id)


@router.get("/{issue_id}", response_model=IssueResponse)
async def get_issue(issue_id: int):
    """
    Get a specific issue by ID
    """
    issue = issue_service.get_issue_by_id(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue


@router.get("/{issue_id}/history", response_model=List[IssueStatusHistory])
async def get_issue_history(issue_id: int):
    """
    Get issue status change history
    """
    issue = issue_service.get_issue_by_id(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    return issue_service.get_issue_history(issue_id)


@router.put("/{issue_id}", response_model=IssueResponse)
async def update_issue(
    issue_id: int,
    issue_update: IssueUpdate,
    changed_by: str = Query("System", description="Person making the change")
):
    """
    Update an issue

    Only provided fields will be updated. All fields are optional.
    """
    issue = issue_service.get_issue_by_id(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    try:
        updated_issue = issue_service.update_issue(issue_id, issue_update, changed_by)
        return updated_issue
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{issue_id}/escalate", response_model=IssueResponse)
async def escalate_issue(issue_id: int, escalate_data: EscalateIssue):
    """
    Escalate an issue

    - **escalation_level**: PM/Senior Manager/Executive
    - **escalation_reason**: Reason for escalation
    - **changed_by**: Person who escalated
    """
    issue = issue_service.get_issue_by_id(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    try:
        escalated_issue = issue_service.escalate_issue(issue_id, escalate_data)
        return escalated_issue
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{issue_id}/resolve", response_model=IssueResponse)
async def resolve_issue(issue_id: int, resolve_data: ResolveIssue):
    """
    Resolve an issue

    Sets status to 'Resolved' and records resolution details

    - **resolution**: Resolution description
    - **root_cause**: Root cause analysis (optional)
    - **resolved_by**: Person who resolved
    """
    issue = issue_service.get_issue_by_id(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    try:
        resolved_issue = issue_service.resolve_issue(issue_id, resolve_data)
        return resolved_issue
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{issue_id}/close", response_model=IssueResponse)
async def close_issue(
    issue_id: int,
    changed_by: str = Query("System", description="Person closing the issue")
):
    """
    Close an issue

    Sets status to 'Closed' and records close date
    """
    issue = issue_service.get_issue_by_id(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    try:
        closed_issue = issue_service.close_issue(issue_id, changed_by)
        return closed_issue
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{issue_id}", status_code=204)
async def delete_issue(issue_id: int):
    """
    Delete an issue

    This will also delete all related status history.
    """
    success = issue_service.delete_issue(issue_id)
    if not success:
        raise HTTPException(status_code=404, detail="Issue not found")
