"""
API routes for CSV import/export operations
No external dependencies required - uses Python built-in csv module
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from fastapi.responses import Response
from typing import Dict, Any
from backend.services.csv_service import CSVService

router = APIRouter()
csv_service = CSVService()


@router.post("/import/wbs", response_model=Dict[str, Any])
async def import_wbs_from_csv(
    file: UploadFile = File(...),
    project_id: str = Query(..., description="Project ID to import WBS into")
):
    """
    Import WBS items from CSV file

    Expected CSV format:
    - Chinese column headers (項目, 任務說明, 單位, etc.)
    - Required columns: 項目 (WBS ID), 任務說明 (Task Name)
    - Comma separated values
    - UTF-8 encoding

    Returns import summary with success/failure counts
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Only CSV files (.csv) are supported."
        )

    try:
        content = await file.read()
        # Try UTF-8 first, then fall back to other encodings
        try:
            file_content = content.decode('utf-8-sig')  # Handle BOM
        except UnicodeDecodeError:
            try:
                file_content = content.decode('utf-8')
            except UnicodeDecodeError:
                file_content = content.decode('big5')  # Traditional Chinese

        result = csv_service.import_wbs_from_csv(file_content, project_id)

        if not result['success'] and result.get('error'):
            raise HTTPException(status_code=400, detail=result['error'])

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export/wbs/{project_id}")
async def export_wbs_to_csv(project_id: str):
    """
    Export WBS items to CSV file

    Returns downloadable CSV file with:
    - Chinese column headers
    - All WBS data for the specified project
    - Can be opened directly in Excel
    """
    try:
        result = csv_service.export_wbs_to_csv(project_id)

        if not result['success']:
            raise HTTPException(status_code=400, detail=result.get('error', 'Export failed'))

        # Return CSV file with BOM for Excel compatibility
        content = '\ufeff' + result['content']  # Add UTF-8 BOM

        return Response(
            content=content.encode('utf-8'),
            media_type='text/csv; charset=utf-8',
            headers={
                'Content-Disposition': f'attachment; filename=WBS_{project_id}.csv'
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/template/wbs")
async def download_wbs_template():
    """
    Download WBS import template

    Returns a sample CSV file with:
    - Correct column headers in Chinese
    - 4 sample WBS items showing proper format
    - Can be opened and edited in Excel

    Use this template to prepare your WBS data for import
    """
    try:
        content = csv_service.create_wbs_template()

        # Add UTF-8 BOM for Excel compatibility
        content_with_bom = '\ufeff' + content

        return Response(
            content=content_with_bom.encode('utf-8'),
            media_type='text/csv; charset=utf-8',
            headers={
                'Content-Disposition': 'attachment; filename=WBS_Template.csv'
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export/pending/{project_id}")
async def export_pending_to_csv(project_id: str):
    """
    Export Pending items to CSV file
    """
    try:
        result = csv_service.export_pending_to_csv(project_id)

        if not result['success']:
            raise HTTPException(status_code=400, detail=result.get('error', 'Export failed'))

        content = '\ufeff' + result['content']

        return Response(
            content=content.encode('utf-8'),
            media_type='text/csv; charset=utf-8',
            headers={
                'Content-Disposition': f'attachment; filename=Pending_{project_id}.csv'
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export/issues/{project_id}")
async def export_issues_to_csv(project_id: str):
    """
    Export Issues to CSV file
    """
    try:
        result = csv_service.export_issues_to_csv(project_id)

        if not result['success']:
            raise HTTPException(status_code=400, detail=result.get('error', 'Export failed'))

        content = '\ufeff' + result['content']

        return Response(
            content=content.encode('utf-8'),
            media_type='text/csv; charset=utf-8',
            headers={
                'Content-Disposition': f'attachment; filename=Issues_{project_id}.csv'
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
