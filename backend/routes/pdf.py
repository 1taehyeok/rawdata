# backend/routes/pdf.py
import pdfkit
from fastapi import APIRouter, UploadFile, File, Response
from database import load_data
import os
from PyPDF2 import PdfReader, PdfWriter

router = APIRouter(prefix="/pdf", tags=["PDF"])
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FORMS_DIR = os.path.join(BASE_DIR, "data", "forms")
TESTS_DIR = os.path.join(BASE_DIR, "data", "tests")
config = pdfkit.configuration(wkhtmltopdf="C:/Program Files/wkhtmltopdf/bin/wkhtmltopdf.exe")

def generate_pdf_html(data):
    pages = data.get("pages", [])
    if not pages:
        return None, "❌ 페이지 데이터가 비어 있음"

    total_pages = len(pages)
    html = """<html><head><meta charset="utf-8"><style>
    @font-face { font-family: 'NotoSansKR'; src: url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR&display=swap'); }
    body { font-family: 'NotoSansKR', 'Malgun Gothic', sans-serif; margin: 0; }
    table { border-collapse: collapse; width: 100%; table-layout: fixed; }
    th, td { border: 1px solid black; padding: 5px; font-size: 14px; text-align: center; display: table-cell; }
    .page-break { page-break-before: always; }
    .footer { text-align: center; font-size: 12px; margin-top: 10px; margin-bottom: 20mm; }
    </style></head><body>"""

    for page_index, page_data in enumerate(pages):
        if page_index > 0:
            html += '<div class="page-break"></div>'
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
        html += f'<div class="footer">{data.get("formCode", "서식P702-2-05")} (Rev.7)       page {page_index + 1}/{total_pages}</div>'

    html += "</body></html>"
    return html, None

def generate_pdf(file_path, output_file="output.pdf", test_id=None, revision=None):
    data = load_data(file_path)
    html, error = generate_pdf_html(data)
    if error:
        return Response(error, status_code=500)
    
    pdf_options = {
        "page-size": "A4",
        "margin-top": "10mm",
        "margin-right": "10mm",
        "margin-bottom": "20mm",
        "margin-left": "10mm",
    }
    temp_file = "temp_output.pdf"
    try:
        pdfkit.from_string(html, temp_file, configuration=config, options=pdf_options)
        
        pdf_reader = PdfReader(temp_file)
        pdf_writer = PdfWriter()
        for page in pdf_reader.pages:
            pdf_writer.add_page(page)
        
        # 메타데이터에 test_id와 revision 추가
        metadata = {}
        if test_id:
            metadata["/test-id"] = test_id
        if revision is not None:
            metadata["/revision"] = str(revision)
        if metadata:
            pdf_writer.add_metadata(metadata)
        
        with open(output_file, "wb") as f:
            pdf_writer.write(f)
        
        os.remove(temp_file)
        return Response(open(output_file, "rb").read(), media_type="application/pdf",
                        headers={"Content-Disposition": f"attachment; filename={os.path.basename(file_path).replace('.json', '.pdf')}"})
    except Exception as e:
        return Response(f"PDF 생성 중 오류 발생: {str(e)}", status_code=500)

@router.get("/form/{form_id}")
async def generate_form_pdf(form_id: int):
    forms_data = load_data(os.path.join(BASE_DIR, "data", "form_list.json"))
    form = next((f for f in forms_data["forms"] if f["id"] == form_id), None)
    if not form:
        return Response("❌ 양식을 찾을 수 없음", status_code=404)
    file_path = os.path.join(FORMS_DIR, os.path.basename(form["file"]))
    return generate_pdf(file_path)

@router.get("/test/{test_id}")
async def generate_test_pdf(test_id: str, revision: int = None):
    # revision이 없으면 기본 파일(test_<UUID>.json)을 먼저 확인
    base_file_path = os.path.join(TESTS_DIR, f"test_{test_id}.json")
    rev_file_path = os.path.join(TESTS_DIR, f"test_{test_id}_Rev{revision}.json") if revision is not None else None
    
    if rev_file_path and os.path.exists(rev_file_path):
        file_path = rev_file_path
    elif os.path.exists(base_file_path):
        file_path = base_file_path
    else:
        return Response("❌ 시험 데이터를 찾을 수 없음", status_code=404)
    
    return generate_pdf(file_path, test_id=test_id, revision=revision)


@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        # PDF 파일 읽기
        pdf_reader = PdfReader(file.file)
        metadata = pdf_reader.metadata
        test_id = metadata.get("/test-id")  # 메타데이터에서 UUID 추출
        if not test_id:
            return Response("❌ PDF에 UUID가 포함되어 있지 않습니다.", status_code=400)
        
        # 해당 test_<UUID>.json 파일 로드
        file_path = os.path.join(TESTS_DIR, f"test_{test_id}.json")
        if not os.path.exists(file_path):
            return Response("❌ 해당 시험 데이터를 찾을 수 없습니다.", status_code=404)
        
        data = load_data(file_path)
        return {"test_id": test_id, "data": data}  # UUID와 데이터 반환
    except Exception as e:
        return Response(f"❌ PDF 처리 중 오류 발생: {str(e)}", status_code=500)