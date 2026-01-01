"""
測試 Excel 匯入功能的診斷腳本
"""
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from backend.services.excel_service import ExcelService
import pandas as pd

def test_excel_import(file_path: str):
    """測試 Excel 匯入功能"""
    print(f"📁 檢查檔案: {file_path}")
    print("=" * 60)

    # 檢查檔案是否存在
    if not Path(file_path).exists():
        print(f"❌ 錯誤：檔案不存在 - {file_path}")
        return

    print("✓ 檔案存在")
    print()

    # 讀取 Excel 檔案查看欄位
    try:
        df = pd.read_excel(file_path)
        print(f"📊 Excel 檔案資訊:")
        print(f"   - 總行數: {len(df)}")
        print(f"   - 總欄位數: {len(df.columns)}")
        print(f"\n📋 欄位列表:")
        for i, col in enumerate(df.columns, 1):
            print(f"   {i}. {col}")
        print()

        # 檢查必要欄位
        required_chinese_cols = ['項目', '任務說明']
        missing_cols = [col for col in required_chinese_cols if col not in df.columns]
        if missing_cols:
            print(f"❌ 缺少必要欄位: {', '.join(missing_cols)}")
            return
        print(f"✓ 必要欄位檢查通過")
        print()

        # 檢查是否有「內部安排」欄位
        has_internal = '內部安排' in df.columns
        print(f"📌 「內部安排」欄位: {'存在 ✓' if has_internal else '不存在（將使用預設值 False）'}")
        print()

        # 顯示前幾筆資料
        print("📄 前 3 筆資料預覽:")
        print(df.head(3).to_string())
        print()

    except Exception as e:
        print(f"❌ 讀取 Excel 檔案時發生錯誤: {e}")
        import traceback
        traceback.print_exc()
        return

    # 測試匯入
    print("=" * 60)
    print("🚀 開始測試匯入功能...")
    print()

    try:
        excel_service = ExcelService()
        result = excel_service.import_wbs_from_excel(file_path, "TEST_PROJECT")

        if result['success']:
            print(f"✅ 匯入成功!")
            print(f"   - 成功匯入: {result['imported']} 筆")
            print(f"   - 失敗: {result['failed']} 筆")

            if result['failed'] > 0 and 'failed_items' in result:
                print(f"\n❌ 失敗項目詳情:")
                for item in result['failed_items']:
                    print(f"   - 第 {item['row']} 行 (WBS ID: {item['wbs_id']})")
                    print(f"     錯誤: {item['error']}")
        else:
            print(f"❌ 匯入失敗!")
            print(f"   錯誤訊息: {result.get('error', 'Unknown error')}")

    except Exception as e:
        print(f"❌ 執行匯入時發生錯誤: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("使用方式: python test_excel_import.py <Excel檔案路徑>")
        print()
        print("範例:")
        print("  python test_excel_import.py /path/to/your/wbs.xlsx")
        sys.exit(1)

    file_path = sys.argv[1]
    test_excel_import(file_path)
