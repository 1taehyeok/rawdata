# backend/migrate.py
import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FORMS_DIR = os.path.join(BASE_DIR, "data", "forms")
TESTS_DIR = os.path.join(BASE_DIR, "data", "tests")

def migrate_cell_alignments(data):
    """cellAlignments의 horizontalAlign과 verticalAlign을 align으로 통합"""
    if "pages" not in data:
        return data
    
    new_data = data.copy()
    for page in new_data.get("pages", []):
        if "settings" in page and "cellAlignments" in page["settings"]:
            cell_alignments = page["settings"]["cellAlignments"]
            for key in cell_alignments:
                old_alignment = cell_alignments[key]
                # horizontalAlign을 기본값으로 사용, 없으면 "htLeft htMiddle"로 설정
                align_value = old_alignment.get("horizontalAlign", "htLeft htMiddle")
                cell_alignments[key] = {"align": align_value}
    return new_data

def process_file(file_path):
    """단일 JSON 파일을 읽고 마이그레이션 후 저장"""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        migrated_data = migrate_cell_alignments(data)
        
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(migrated_data, f, indent=4, ensure_ascii=False)
        print(f"✅ Migrated: {file_path}")
    except Exception as e:
        print(f"❌ Error migrating {file_path}: {str(e)}")

def migrate_all_files():
    """forms와 tests 디렉토리의 모든 JSON 파일을 처리"""
    # forms 디렉토리 처리
    for filename in os.listdir(FORMS_DIR):
        if filename.endswith(".json"):
            file_path = os.path.join(FORMS_DIR, filename)
            process_file(file_path)
    
    # tests 디렉토리 처리
    for filename in os.listdir(TESTS_DIR):
        if filename.endswith(".json"):
            file_path = os.path.join(TESTS_DIR, filename)
            process_file(file_path)

if __name__ == "__main__":
    print("Starting migration...")
    migrate_all_files()
    print("Migration completed!")