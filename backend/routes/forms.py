# backend/routes/forms.py
from fastapi import APIRouter
import os
from database import load_data, save_data

router = APIRouter(prefix="/forms", tags=["Forms"])
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # backend 폴더 기준
FORM_LIST_FILE = os.path.join(BASE_DIR, "data", "form_list.json")
FORMS_DIR = os.path.join(BASE_DIR, "data", "forms")

@router.get("/")
async def get_form_list():
    return load_data(FORM_LIST_FILE)

@router.post("/")
async def create_form(form: dict):
    forms_data = load_data(FORM_LIST_FILE)
    new_id = max([f["id"] for f in forms_data["forms"]], default=0) + 1
    file_name = f"form_{new_id}.json"
    form_file_path = os.path.join(FORMS_DIR, file_name)
    form_data = {
        "formName": form.get("name", f"form_{new_id}"),
        "formCode": form.get("formCode", "P702-2-05"),
        "totalPages": form.get("totalPages", 1),
        "pages": [{"table": [[]], "settings": {}}]
    }
    save_data(form_file_path, form_data)
    forms_data["forms"].append({
        "id": new_id,
        "name": form_data["formName"],
        "file": f"forms/{file_name}",  # 상대 경로로 저장
        "createdAt": "2025-02-24T10:00:00Z",
        "description": form.get("description", "")
    })
    save_data(FORM_LIST_FILE, forms_data)
    return {"message": "Form created", "id": new_id}

@router.get("/{form_id}")
async def get_form(form_id: int):
    forms_data = load_data(FORM_LIST_FILE)
    form = next((f for f in forms_data["forms"] if f["id"] == form_id), None)
    if not form:
        return {"error": "Form not found"}
    # 파일 이름만 추출해서 FORMS_DIR과 결합
    file_name = os.path.basename(form["file"])  # "forms/form_1.json" -> "form_1.json"
    form_file_path = os.path.join(FORMS_DIR, file_name)
    return load_data(form_file_path)

@router.post("/{form_id}")
async def save_form(form_id: int, data: dict):
    forms_data = load_data(FORM_LIST_FILE)
    form = next((f for f in forms_data["forms"] if f["id"] == form_id), None)
    if not form:
        return {"error": "Form not found"}
    file_name = os.path.basename(form["file"])
    form_file_path = os.path.join(FORMS_DIR, file_name)
    save_data(form_file_path, data)
    return {"message": "Form saved"}

@router.post("/{form_id}/name")
async def update_form_name(form_id: int, update: dict):
    forms_data = load_data(FORM_LIST_FILE)
    form = next((f for f in forms_data["forms"] if f["id"] == form_id), None)
    if not form:
        return {"error": "Form not found"}
    form_data = load_data(form["file"])
    form_data["formName"] = update.get("name", form_data["formName"])
    form_data["formCode"] = update.get("formCode", form_data["formCode"])  # formCode 추가
    form["name"] = form_data["formName"]  # form_list.json 업데이트
    save_data(form["file"], form_data)
    save_data(FORM_LIST_FILE, forms_data)
    return {"message": "Form name updated"}

@router.delete("/{form_id}")
async def delete_form(form_id: int):
    forms_data = load_data(FORM_LIST_FILE)
    form = next((f for f in forms_data["forms"] if f["id"] == form_id), None)
    if not form:
        return Response("❌ 양식을 찾을 수 없음", status_code=404)
    
    # 파일 삭제
    file_name = os.path.basename(form["file"])
    form_file_path = os.path.join(FORMS_DIR, file_name)
    if os.path.exists(form_file_path):
        os.remove(form_file_path)
    
    # 목록에서 제거
    forms_data["forms"] = [f for f in forms_data["forms"] if f["id"] != form_id]
    save_data(FORM_LIST_FILE, forms_data)
    return {"message": "Form deleted"}

@router.post("/{form_id}/copy")
async def copy_form(form_id: int):
    forms_data = load_data(FORM_LIST_FILE)
    form = next((f for f in forms_data["forms"] if f["id"] == form_id), None)
    if not form:
        return Response("❌ 양식을 찾을 수 없음", status_code=404)
    
    # 새 ID 생성
    new_id = max([f["id"] for f in forms_data["forms"]], default=0) + 1
    file_name = os.path.basename(form["file"])
    form_file_path = os.path.join(FORMS_DIR, file_name)
    new_file_name = f"form_{new_id}.json"
    new_form_file_path = os.path.join(FORMS_DIR, new_file_name)
    
    # 기존 데이터 복사 및 이름 수정
    form_data = load_data(form_file_path)
    new_form_name = f"{form['name']} (복사본)"  # form_list.json의 name 사용
    form_data["formName"] = new_form_name  # form_<id>.json의 formName 업데이트
    save_data(new_form_file_path, form_data)
    
    # 목록에 추가
    forms_data["forms"].append({
        "id": new_id,
        "name": new_form_name,
        "file": f"forms/{new_file_name}",
        "createdAt": "2025-02-25T10:00:00Z",
        "description": form.get("description", "")
    })
    save_data(FORM_LIST_FILE, forms_data)
    return {"message": "Form copied", "id": new_id}

@router.post("/{form_id}/move-page")
async def move_page(form_id: int, move_data: dict):
    forms_data = load_data(FORM_LIST_FILE)
    form = next((f for f in forms_data["forms"] if f["id"] == form_id), None)
    if not form:
        return Response("❌ 양식을 찾을 수 없음", status_code=404)
    
    file_name = os.path.basename(form["file"])
    form_file_path = os.path.join(FORMS_DIR, file_name)
    form_data = load_data(form_file_path)
    
    current_index = move_data.get("currentIndex")  # 이동할 현재 페이지 인덱스 (0-based)
    target_index = move_data.get("targetIndex")  # 목표 페이지 인덱스 (0-based)
    
    if current_index is None or target_index is None or \
       current_index < 0 or target_index < 0 or \
       current_index >= len(form_data["pages"]) or target_index >= len(form_data["pages"]):
        return Response("❌ 유효하지 않은 페이지 인덱스", status_code=400)
    
    # 페이지 이동
    page_to_move = form_data["pages"].pop(current_index)
    form_data["pages"].insert(target_index, page_to_move)
    form_data["totalPages"] = len(form_data["pages"])
    save_data(form_file_path, form_data)
    
    return {"message": "Page moved successfully"}

@router.post("/{form_id}/copy-page")
async def copy_page(form_id: int, copy_data: dict):
    forms_data = load_data(FORM_LIST_FILE)
    form = next((f for f in forms_data["forms"] if f["id"] == form_id), None)
    if not form:
        return Response("❌ 양식을 찾을 수 없음", status_code=404)
    
    file_name = os.path.basename(form["file"])
    form_file_path = os.path.join(FORMS_DIR, file_name)
    form_data = load_data(form_file_path)
    
    page_index = copy_data.get("pageIndex")  # 복사할 페이지 인덱스 (0-based)
    if page_index is None or page_index < 0 or page_index >= len(form_data["pages"]):
        return Response("❌ 유효하지 않은 페이지 인덱스", status_code=400)
    
    # 페이지 복사
    page_to_copy = form_data["pages"][page_index]
    form_data["pages"].insert(page_index + 1, page_to_copy)  # 다음 페이지에 삽입
    form_data["totalPages"] = len(form_data["pages"])
    save_data(form_file_path, form_data)
    
    return {"message": "Page copied successfully"}