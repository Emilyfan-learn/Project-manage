"""
API routes for Excel import/export operations
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from typing import Dict, Any
from pathlib import Path
import tempfile
import os
from backend.services.excel_service import ExcelService

router = APIRouter()
excel_service = ExcelService()


@router.post("/import/wbs", response_model=Dict[str, Any])
async def import_wbs_from_excel(
    file: UploadFile = File(...),
    project_id: str = Query(..., description="Project ID to import WBS into")
):
    """
    Import WBS items from Excel file

    Expected Excel format:
    - Chinese column headers (項目, 任務說明, 單位, etc.)
    - Required columns: 項目 (WBS ID), 任務說明 (Task Name)
    - Supports multiple date formats: mm/dd/yyyy, yyyy-mm-dd, etc.

    Returns import summary with success/failure counts
    """
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Only Excel files (.xlsx, .xls) are supported."
        )

    try:
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name

        # Import from Excel
        result = excel_service.import_wbs_from_excel(tmp_path, project_id)

        # Clean up temporary file
        os.unlink(tmp_path)

        if not result['success']:
            raise HTTPException(status_code=400, detail=result.get('error', 'Import failed'))

        return result

    except HTTPException:
        raise
    except Exception as e:
        # Clean up on error
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export/wbs/{project_id}")
async def export_wbs_to_excel(project_id: str):
    """
    Export WBS items to Excel file

    Creates a styled Excel file with:
    - Chinese column headers
    - Colored header row
    - Auto-adjusted column widths
    - Red highlighting for overdue items
    - All WBS data for the specified project

    Returns downloadable Excel file
    """
    try:
        # Create temporary file for export
        tmp_dir = tempfile.mkdtemp()
        output_path = os.path.join(tmp_dir, f"WBS_{project_id}.xlsx")

        # Export to Excel
        result = excel_service.export_wbs_to_excel(project_id, output_path)

        if not result['success']:
            raise HTTPException(status_code=400, detail=result.get('error', 'Export failed'))

        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Export file was not created")

        # Return file for download
        return FileResponse(
            path=output_path,
            filename=f"WBS_{project_id}.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=WBS_{project_id}.xlsx"
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

    Returns a sample Excel file with:
    - Correct column headers in Chinese
    - 4 sample WBS items showing proper format
    - Date format examples
    - Category and status examples

    Use this template to prepare your WBS data for import
    """
    try:
        # Create temporary file for template
        tmp_dir = tempfile.mkdtemp()
        output_path = os.path.join(tmp_dir, "WBS_Template.xlsx")

        # Create template
        result = excel_service.create_wbs_template(output_path)

        if not result['success']:
            raise HTTPException(status_code=400, detail=result.get('error', 'Template creation failed'))

        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Template file was not created")

        # Return file for download
        return FileResponse(
            path=output_path,
            filename="WBS_Template.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": "attachment; filename=WBS_Template.xlsx"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export/pending/{project_id}")
async def export_pending_to_excel(project_id: str):
    """
    Export Pending items to Excel file

    Creates a styled Excel file with:
    - Chinese column headers
    - Green colored header row
    - Auto-adjusted column widths
    - All pending items data for the specified project

    Returns downloadable Excel file
    """
    try:
        from urllib.parse import quote

        # Create temporary file for export
        tmp_dir = tempfile.mkdtemp()
        output_path = os.path.join(tmp_dir, f"pending_{project_id}.xlsx")

        # Export to Excel
        result = excel_service.export_pending_to_excel(project_id, output_path)

        if not result['success']:
            raise HTTPException(status_code=400, detail=result.get('error', 'Export failed'))

        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Export file was not created")

        # Use URL-encoded filename for Chinese characters
        chinese_filename = f"待辦事項_{project_id}.xlsx"
        encoded_filename = quote(chinese_filename)

        # Return file for download
        return FileResponse(
            path=output_path,
            filename=chinese_filename,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export/issues/{project_id}")
async def export_issues_to_excel(project_id: str):
    """
    Export Issues to Excel file

    Creates a styled Excel file with:
    - Chinese column headers
    - Red colored header row
    - Auto-adjusted column widths
    - Orange highlighting for escalated items
    - All issue tracking data for the specified project

    Returns downloadable Excel file
    """
    try:
        from urllib.parse import quote

        # Create temporary file for export
        tmp_dir = tempfile.mkdtemp()
        output_path = os.path.join(tmp_dir, f"issues_{project_id}.xlsx")

        # Export to Excel
        result = excel_service.export_issues_to_excel(project_id, output_path)

        if not result['success']:
            raise HTTPException(status_code=400, detail=result.get('error', 'Export failed'))

        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Export file was not created")

        # Use URL-encoded filename for Chinese characters
        chinese_filename = f"問題追蹤_{project_id}.xlsx"
        encoded_filename = quote(chinese_filename)

        # Return file for download
        return FileResponse(
            path=output_path,
            filename=chinese_filename,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
