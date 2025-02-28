# backend/routes/tests.py
from fastapi import APIRouter
import os
from uuid import uuid4
from database import save_data, load_data

router = APIRouter(prefix="/tests", tags=["Tests"])
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TESTS_DIR = os.path.join(BASE_DIR, "data", "tests")

@router.post("/temp")
async def save_temp_test(data: dict, temp_test_id: str = None):
    if temp_test_id:
        temp_file_path = os.path.join(TESTS_DIR, f"temp_test_{temp_test_id}.json")
        print(f"Updating existing temp file: {temp_file_path}")
    else:
        temp_test_id = str(uuid4())
        temp_file_path = os.path.join(TESTS_DIR, f"temp_test_{temp_test_id}.json")
        print(f"Creating new temp file: {temp_file_path}")
    
    save_data(temp_file_path, data)
    return {"message": "Temporary test saved", "temp_test_id": temp_test_id}

@router.post("/")
async def save_test(data: dict, temp_test_id: str = None):
    test_id = temp_test_id or str(uuid4())  # temp_test_id가 있으면 재사용
    test_file_path = os.path.join(TESTS_DIR, f"test_{test_id}.json")
    
    if temp_test_id:
        temp_file_path = os.path.join(TESTS_DIR, f"temp_test_{temp_test_id}.json")
        if os.path.exists(temp_file_path):
            os.rename(temp_file_path, test_file_path)  # temp 파일을 test 파일로 이름 변경
            print(f"Renamed {temp_file_path} to {test_file_path}")
        else:
            save_data(test_file_path, data)  # temp 파일이 없으면 새로 저장
    else:
        save_data(test_file_path, data)
    
    data["revision"] = 0  # revision은 항상 0으로 고정
    save_data(test_file_path, data)  # 데이터 갱신
    return {"message": "Test saved", "test_id": test_id, "revision": 0}

@router.post("/{test_id}")
async def update_test(test_id: str, data: dict):
    revision = 0
    for filename in os.listdir(TESTS_DIR):
        if filename.startswith(f"test_{test_id}_Rev"):
            rev_num = int(filename.split("_Rev")[1].split(".json")[0])
            revision = max(revision, rev_num)
    
    original_file = os.path.join(TESTS_DIR, f"test_{test_id}.json")
    if os.path.exists(original_file):
        revision += 1
    
    new_file_path = os.path.join(TESTS_DIR, f"test_{test_id}_Rev{revision}.json")
    data["revision"] = revision
    save_data(new_file_path, data)
    return {"message": "Test updated", "test_id": test_id, "revision": revision}