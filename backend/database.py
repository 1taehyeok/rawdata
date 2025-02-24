import json
import os

DATA_FILE = "data/rawdata.json"

def load_data():
    if not os.path.exists(DATA_FILE):
        print("🚨 [FastAPI] JSON 파일이 존재하지 않음! 빈 데이터 반환")
        return {"pages": [{"table": [], "settings": {}}]}  # 기본 구조: 페이지 배열

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            # 기존 단일 테이블 데이터를 첫 페이지로 변환
            if "pages" not in data:
                return {"pages": [{"table": data.get("table", []), "settings": data.get("settings", {})}]}
            return data
    except json.JSONDecodeError as e:
        print("❌ [FastAPI] JSON 파싱 오류:", str(e))
        return {"pages": [{"table": [], "settings": {}}]}

def save_data(data):
    try:
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print("✅ 데이터 저장 완료")
    except Exception as e:
        print("❌ 데이터 저장 오류:", str(e))