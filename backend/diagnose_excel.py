#!/usr/bin/env python3
"""
WBS 匯入診斷工具 - 檢查 Excel 匯入問題
"""
import sys
import pandas as pd
from pathlib import Path

def diagnose_excel(file_path):
    """診斷 Excel 檔案結構和內容"""
    print("=" * 60)
    print("WBS Excel 匯入診斷工具")
    print("=" * 60)
    print()

    # 檢查檔案是否存在
    if not Path(file_path).exists():
        print(f"❌ 檔案不存在: {file_path}")
        return

    print(f"📄 檔案: {file_path}")
    print()

    try:
        # 讀取 Excel
        df = pd.read_excel(file_path)

        # 1. 顯示欄位名稱
        print("1️⃣  Excel 欄位名稱：")
        print("-" * 60)
        for i, col in enumerate(df.columns, 1):
            print(f"   {i:2d}. [{col}]")
        print()

        # 2. 檢查必要欄位
        print("2️⃣  必要欄位檢查：")
        print("-" * 60)
        required_columns = {
            '項目': 'WBS ID',
            '父項目': '父項目 ID',
            '任務說明': '任務名稱',
            '預計開始 (原始)': '原始計劃開始日期',
            '預計結束 (原始)': '原始計劃結束日期',
            '預計開始 (調整)': '調整後計劃開始日期',
            '預計結束 (調整)': '調整後計劃結束日期'
        }

        for col_name, description in required_columns.items():
            if col_name in df.columns:
                print(f"   ✅ {col_name:20s} ({description})")
            else:
                print(f"   ❌ {col_name:20s} ({description}) - 缺少此欄位")
        print()

        # 3. 顯示前 3 行資料
        print("3️⃣  前 3 行資料預覽：")
        print("-" * 60)

        # 只顯示關鍵欄位
        key_columns = ['項目', '父項目', '任務說明', '預計開始 (原始)', '預計結束 (原始)', '預計開始 (調整)', '預計結束 (調整)']
        display_columns = [col for col in key_columns if col in df.columns]

        if display_columns:
            preview_df = df[display_columns].head(3)
            print(preview_df.to_string(index=False))
        else:
            print("   ⚠️  找不到關鍵欄位")
        print()

        # 4. 檢查父項目欄位
        if '父項目' in df.columns:
            print("4️⃣  父項目欄位分析：")
            print("-" * 60)
            parent_col = df['父項目']
            total_rows = len(df)
            has_parent = parent_col.notna().sum()
            no_parent = parent_col.isna().sum()

            print(f"   總行數: {total_rows}")
            print(f"   有父項目: {has_parent} 行")
            print(f"   無父項目: {no_parent} 行")
            print()

            if has_parent > 0:
                print("   父項目值範例（前 5 個非空值）:")
                sample_parents = parent_col.dropna().head(5)
                for idx, val in sample_parents.items():
                    print(f"      第 {idx+2} 行: [{val}] (類型: {type(val).__name__})")
            print()

        # 5. 檢查日期欄位
        print("5️⃣  日期欄位分析：")
        print("-" * 60)
        date_columns = {
            '預計開始 (原始)': 'original_planned_start',
            '預計結束 (原始)': 'original_planned_end',
            '預計開始 (調整)': 'revised_planned_start',
            '預計結束 (調整)': 'revised_planned_end'
        }

        for col_name, field_name in date_columns.items():
            if col_name in df.columns:
                col_data = df[col_name]
                total = len(col_data)
                filled = col_data.notna().sum()
                empty = col_data.isna().sum()

                print(f"\n   📅 {col_name}:")
                print(f"      填寫: {filled}/{total} 行, 空白: {empty} 行")

                # 顯示範例值
                if filled > 0:
                    sample = col_data.dropna().head(3)
                    print(f"      範例值:")
                    for idx, val in sample.items():
                        print(f"         第 {idx+2} 行: [{val}] (類型: {type(val).__name__})")

        print()
        print("=" * 60)
        print("診斷完成！")
        print()
        print("💡 建議：")
        print("   1. 確認欄位名稱完全相符（包括空格和括號）")
        print("   2. 父項目欄位應該填寫對應的 WBS ID（如 1, 2, 3）")
        print("   3. 日期格式建議使用 yyyy/mm/dd（如 2024/01/15）")
        print("=" * 60)

    except Exception as e:
        print(f"❌ 錯誤: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python diagnose_excel.py <excel檔案路徑>")
        print()
        print("範例:")
        print("  python backend/diagnose_excel.py /path/to/wbs.xlsx")
        sys.exit(1)

    excel_file = sys.argv[1]
    diagnose_excel(excel_file)
