"""
快速測試範本生成和匯入
"""
import sys
from pathlib import Path
import tempfile
import os

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from backend.services.excel_service import ExcelService

def test_template():
    """測試範本生成和匯入"""
    excel_service = ExcelService()

    # 1. 創建範本
    print("=" * 60)
    print("步驟 1: 創建範本")
    print("=" * 60)

    tmp_dir = tempfile.mkdtemp()
    template_path = os.path.join(tmp_dir, "test_template.xlsx")

    result = excel_service.create_wbs_template(template_path)

    if not result['success']:
        print(f"❌ 範本創建失敗: {result.get('error')}")
        return

    print(f"✓ 範本創建成功: {template_path}")
    print()

    # 2. 讀取範本內容
    print("=" * 60)
    print("步驟 2: 檢查範本內容")
    print("=" * 60)

    import pandas as pd
    df = pd.read_excel(template_path)

    print(f"總行數: {len(df)}")
    print(f"總欄位數: {len(df.columns)}")
    print()
    print("欄位列表:")
    for i, col in enumerate(df.columns, 1):
        print(f"  {i}. {col}")
    print()

    print("範本資料:")
    print(df.to_string())
    print()

    # 3. 清理舊的測試資料
    print("=" * 60)
    print("步驟 3: 清理舊的測試資料")
    print("=" * 60)

    import sqlite3
    from backend.config import settings

    conn = sqlite3.connect(str(settings.database_path))
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tracking_items WHERE project_id = 'TEST_PRJ'")
    deleted_count = cursor.rowcount
    conn.commit()
    conn.close()

    print(f"✓ 已清理 {deleted_count} 筆舊的測試資料")
    print()

    # 4. 測試匯入
    print("=" * 60)
    print("步驟 4: 測試匯入範本")
    print("=" * 60)

    try:
        import_result = excel_service.import_wbs_from_excel(template_path, "TEST_PRJ")

        if import_result['success']:
            print(f"✅ 匯入成功!")
            print(f"   - 成功: {import_result['imported']} 筆")
            print(f"   - 失敗: {import_result['failed']} 筆")
            print()

            if import_result.get('imported_items'):
                print("✓ 成功匯入的項目:")
                for item in import_result['imported_items']:
                    print(f"  第 {item['row']} 行 - WBS ID: {item['wbs_id']} ({item['task_name']})")
                print()

            if import_result['failed'] > 0:
                print("❌ 失敗項目詳情:")
                for item in import_result.get('failed_items', []):
                    print(f"  第 {item['row']} 行 - WBS ID: {item['wbs_id']}")
                    print(f"  錯誤: {item['error']}")
                    print()
        else:
            print(f"❌ 匯入失敗: {import_result.get('error')}")

    except Exception as e:
        print(f"❌ 匯入時發生錯誤: {e}")
        import traceback
        traceback.print_exc()

    # 清理
    os.unlink(template_path)

if __name__ == "__main__":
    test_template()
