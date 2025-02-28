# backend/database.py
import json
import os

def load_data(file_path):
    print(f"Received file_path: {file_path}")  # 전달된 경로 출력
    print(f"Full absolute path: {os.path.abspath(file_path)}")  # 절대 경로 출력
    print(f"File exists: {os.path.exists(file_path)}")  # 파일 존재 여부 출력
    if not os.path.exists(file_path):
        print(f"🚨 [FastAPI] {file_path} 파일이 존재하지 않음! 빈 데이터 반환")
        if "form_list.json" in file_path:
            return {"forms": []}
        return {
            "formName": os.path.basename(file_path).replace(".json", ""),
            "formCode": "P702-2-05",
            "totalPages": 1,
            "pages": [{"table": [], "settings": {}}]
        }
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if "pages" not in data and "forms" not in data:
                return {"formName": "unknown", "formCode": "P702-2-05", "totalPages": 1, "pages": [{"table": data.get("table", []), "settings": data.get("settings", {})}]}
            return data
    except json.JSONDecodeError as e:
        print(f"❌ [FastAPI] JSON 파싱 오류: {str(e)}")
        if "form_list.json" in file_path:
            return {"forms": []}
        return {"formName": "unknown", "formCode": "P702-2-05", "totalPages": 1, "pages": [{"table": [], "settings": {}}]}
    
def save_data(file_path, data):
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"✅ {file_path} 저장 완료")
    except Exception as e:
        print(f"❌ {file_path} 저장 오류: {str(e)}")
        raise e