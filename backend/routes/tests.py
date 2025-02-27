# backend/routes/tests.py
from fastapi import APIRouter
import os
from uuid import uuid4
from database import save_data, load_data

router = APIRouter(prefix="/tests", tags=["Tests"])
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TESTS_DIR = os.path.join(BASE_DIR, "data", "tests")

@router.post("/")
async def save_test(data: dict):
    test_id = str(uuid4())
    test_file_path = os.path.join(TESTS_DIR, f"test_{test_id}.json")
    data["revision"] = 0
    save_data(test_file_path, data)
    return {"message": "Test saved", "test_id": test_id, "revision": 0}

@router.post("/{test_id}")
async def update_test(test_id: str, data: dict):
    revision = 0
    # 기존 파일에서 최대 revision 찾기
    for filename in os.listdir(TESTS_DIR):
        if filename.startswith(f"test_{test_id}_Rev"):
            rev_num = int(filename.split("_Rev")[1].split(".json")[0])
            revision = max(revision, rev_num)
    
    # 원본 파일이 존재하면 최소 revision을 1로 시작
    original_file = os.path.join(TESTS_DIR, f"test_{test_id}.json")
    if os.path.exists(original_file):
        revision += 1  # 원본이 있으면 다음 번호로 증가
    
    new_file_path = os.path.join(TESTS_DIR, f"test_{test_id}_Rev{revision}.json")
    data["revision"] = revision
    save_data(new_file_path, data)
    return {"message": "Test updated", "test_id": test_id, "revision": revision}