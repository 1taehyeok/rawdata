import pdfkit
from fastapi import APIRouter, Response
from database import load_data

router = APIRouter(prefix="/rawdata", tags=["PDF"])

config = pdfkit.configuration(wkhtmltopdf="C:/Program Files/wkhtmltopdf/bin/wkhtmltopdf.exe")

@router.get("/pdf")
def generate_pdf():
    data = load_data()
    pages = data.get("pages", [])
    if not pages:
        return Response("❌ 페이지 데이터가 비어 있음", status_code=500)

    total_pages = len(pages)

    html = """<html><head><meta charset="utf-8"><style>
    @font-face {
        font-family: 'NotoSansKR';
        src: url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR&display=swap');
    }
    body { font-family: 'NotoSansKR', 'Malgun Gothic', sans-serif; margin: 0; }
    table { border-collapse: collapse; width: 100%; table-layout: fixed; }
    th, td { border: 1px solid black; padding: 5px; font-size: 14px; text-align: center; display: table-cell; }
    .page-break { page-break-before: always; }
    .footer { text-align: center; font-size: 12px; margin-top: 10px; margin-bottom: 20mm; }
    </style></head><body>"""

    for page_index, page_data in enumerate(pages):
        if page_index > 0:
            html += '<div class="page-break"></div>'
        html += f'<h2>Page {page_index + 1}</h2>'

        table_data = page_data.get("table", [])
        merge_cells = page_data.get("settings", {}).get("mergeCells", [])
        col_widths = page_data.get("settings", {}).get("colWidths", [])
        row_heights = page_data.get("settings", {}).get("rowHeights", [])
        cell_alignments = page_data.get("settings", {}).get("cellAlignments", {})
        checkbox_cells = page_data.get("checkboxCells", {})

        if not table_data or not isinstance(table_data[0], list):
            html += "<p>❌ 이 페이지의 테이블 데이터가 비어 있음</p>"
            continue

        merged_map = [[None for _ in range(len(table_data[0]))] for _ in range(len(table_data))]
        for merge in merge_cells:
            row, col = merge["row"], merge["col"]
            rowspan, colspan = merge["rowspan"], merge["colspan"]
            merged_map[row][col] = (rowspan, colspan)
            for r in range(row, row + rowspan):
                for c in range(col, col + colspan):
                    if (r, c) != (row, col):
                        merged_map[r][c] = "merged"

        html += "<table><colgroup>"
        for col_index, width in enumerate(col_widths):
            html += f'<col style="width: {width}px;">'
        html += "</colgroup>"

        for row_index, row in enumerate(table_data):
            row_height = row_heights[row_index] if row_index < len(row_heights) else "auto"
            html += f'<tr style="height: {row_height}px;">'
            for col_index, cell in enumerate(row):
                if merged_map[row_index][col_index] == "merged":
                    continue

                rowspan, colspan = 1, 1
                if isinstance(merged_map[row_index][col_index], tuple):
                    rowspan, colspan = merged_map[row_index][col_index]

                col_width = col_widths[col_index] if col_index < len(col_widths) else "auto"
                alignment = cell_alignments.get(f"{row_index}_{col_index}", {})
                text_align_raw = alignment.get("horizontalAlign", "center").replace("ht", "").lower()
                text_align = text_align_raw.split()[0]
                vertical_align = alignment.get("verticalAlign", "middle").lower()

                cell_key = f"{row_index}_{col_index}"
                cell_content = cell or ""
                if cell_key in checkbox_cells:
                    checkbox_data = checkbox_cells[cell_key]
                    cell_content = f"✔ {checkbox_data['text']}" if checkbox_data["checked"] else checkbox_data["text"]

                html += f'''
                <td rowspan="{rowspan}" colspan="{colspan}" 
                    style="width: {col_width}px; height: {row_height}px; 
                    text-align: {text_align}; vertical-align: {vertical_align};">
                    {cell_content}
                </td>'''
            html += "</tr>"

        html += "</table>"

        # 푸터를 테이블 아래에 자연스럽게 추가
        html += f'<div class="footer">서식P702-2-05(Rev.7) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; page {page_index + 1}/{total_pages}</div>'

    html += "</body></html>"

    with open("debug_output.html", "w", encoding="utf-8") as f:
        f.write(html)

    pdf_options = {
        "page-size": "A4",
        "margin-top": "10mm",
        "margin-right": "10mm",
        "margin-bottom": "20mm",  # 푸터 공간 확보
        "margin-left": "10mm",
    }

    try:
        pdfkit.from_string(html, "output.pdf", configuration=config, options=pdf_options)
    except Exception as e:
        print(f"❌ PDF 생성 실패: {str(e)}")
        return Response(f"PDF 생성 중 오류 발생: {str(e)}", status_code=500)

    print("✅ PDF 변환 완료")
    return Response(open("output.pdf", "rb").read(), media_type="application/pdf",
                    headers={"Content-Disposition": "attachment; filename=rawdata.pdf"})