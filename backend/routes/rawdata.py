from fastapi import APIRouter
import json
import os

router = APIRouter()
DATA_FILE = "data/rawdata.json"

def load_data():
    if not os.path.exists(DATA_FILE):
        return {"pages": [{"table": [], "settings": {}}]}

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if "pages" not in data:
                return {"pages": [{"table": data.get("table", []), "settings": data.get("settings", {})}]}
            return data
    except json.JSONDecodeError:
        return {"pages": [{"table": [], "settings": {}}]}

def save_data(data):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

@router.get("/rawdata")
async def get_rawdata():
    return load_data()

@router.post("/rawdata")
async def save_rawdata(data: dict):
    save_data(data)  # 이제 {"pages": [...]} 형태로 저장
    return {"message": "Data saved successfully"}