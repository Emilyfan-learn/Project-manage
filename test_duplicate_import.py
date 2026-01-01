"""
測試重複匯入（不清理資料）
"""
import sys
from pathlib import Path
import tempfile
import os

project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from backend.services.excel_service import ExcelService

excel_service = ExcelService()

# 創建範本
tmp_dir = tempfile.mkdtemp()
template_path = os.path.join(tmp_dir, "test_template.xlsx")
excel_service.create_wbs_template(template_path)

print("=" * 60)
print("第一次匯入")
print("=" * 60)
result1 = excel_service.import_wbs_from_excel(template_path, "DUPLICATE_TEST")
print(f"成功: {result1['imported']} 筆, 失敗: {result1['failed']} 筆")

print()
print("=" * 60)
print("第二次匯入（測試覆蓋）")
print("=" * 60)
result2 = excel_service.import_wbs_from_excel(template_path, "DUPLICATE_TEST")
print(f"成功: {result2['imported']} 筆, 失敗: {result2['failed']} 筆")

if result2['failed'] > 0:
    print("\n失敗項目:")
    for item in result2.get('failed_items', []):
        print(f"  {item['wbs_id']}: {item['error']}")

# 清理
os.unlink(template_path)

# 清理測試資料
import sqlite3
from backend.config import settings
conn = sqlite3.connect(str(settings.database_path))
cursor = conn.cursor()
cursor.execute("DELETE FROM tracking_items WHERE project_id = 'DUPLICATE_TEST'")
conn.commit()
conn.close()
print(f"\n✓ 測試資料已清理")
