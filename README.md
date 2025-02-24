# rawdata
# 📌 Raw Data 입력 자동화 웹 애플리케이션

## 💡 프로젝트 개요
본 프로젝트는 **수기 데이터 입력 및 스캔 작업을 웹 기반으로 자동화**하는 웹 애플리케이션입니다.  
**Handsontable과 FastAPI**를 활용하여 데이터를 손쉽게 입력, 저장, 유지하며, PDF 변환 기능을 지원합니다.

## 🎯 주요 기능
### ✅ 데이터 입력 및 관리 (Handsontable 기반)
- 웹에서 표 데이터를 **직접 입력, 수정, 삭제 가능**
- 표의 **행/열 추가 및 삭제 지원**
- **셀 병합 기능 제공** → 원하는 형식으로 데이터 정리 가능

### ✅ 데이터 저장 및 유지 (FastAPI 활용)
- 입력한 데이터를 **JSON 파일(rawdata.json)** 에 저장하여 **새로고침 후에도 유지**
- 병합된 데이터까지 저장하여 사용자가 설정한 상태 그대로 복원 가능

### ✅ PDF 변환 기능
- **Handsontable에서 입력한 데이터를 PDF로 변환하여 다운로드 가능**
- **셀 병합 상태를 그대로 반영**하여 PDF 생성

### ✅ 확장성 높은 구조
- Handsontable 기반으로 **데이터 분석, 그래프 생성, 자동 보고서 기능 추가 가능**
- FastAPI를 활용하여 **추후 데이터베이스 연동 가능**

---

## 📁 프로젝트 구조
```bash
project-root/
├── backend/               # 백엔드 (FastAPI 기반)
│   ├── main.py            # FastAPI 서버 실행 및 API 라우팅 관리
│   ├── database.py        # JSON 파일을 통한 데이터 저장 & 불러오기
│   ├── routes/
│   │   ├── rawdata.py     # 데이터 저장/불러오기 API
│   │   ├── pdf.py         # PDF 변환 API
│   ├── data/
│   │   ├── rawdata.json   # 테이블 데이터 및 병합 정보 저장
│   ├── utils/             # (추후 필요 시 활용)
│   ├── templates/         # (PDF 변환 시 필요할 경우 추가)
│   ├── static/            # 정적 파일 (필요 시 추가)
│   ├── venv/              # Python 가상환경
│
├── frontend/              # 프론트엔드 (Vue 기반)
│   ├── src/
│   │   ├── main.js        # Vue 앱의 진입점
│   │   ├── App.vue        # 루트 컴포넌트
│   │   ├── components/
│   │   │   ├── RawData.vue   # Handsontable UI 및 주요 기능 담당
│   │   ├── services/
│   │   │   ├── api.js     # 백엔드 API 연동
│   │   ├── utils/table/   # Handsontable 기능 관련 유틸리티
│   │   │   ├── MergeManager.js       # 셀 병합 관리
│   │   │   ├── CheckboxManager.js    # 체크박스 관리
│   │   │   ├── ContextMenuManager.js # 우클릭 메뉴 관리
│   │   │   ├── ResizeManager.js      # 행/열 크기 조정
│   │   │   ├── TableManager.js       # 테이블 전체 관리
│   ├── public/
│   ├── index.html         # Vue 앱 실행을 위한 HTML 파일
│   ├── package.json       # 프론트엔드 의존성 목록 (Handsontable, Axios 등)
│   ├── vite.config.js     # Vite 설정 파일
│   ├── node_modules/      # 설치된 npm 패키지 저장 폴더

```
## 🚀 기술 스택
### 📌 **Frontend**
- 🖥 **Vue.js** - SPA(단일 페이지 애플리케이션) 구조
- 📊 **Handsontable** - 엑셀 스타일의 테이블 UI 제공
- 🔗 **Axios** - FastAPI와 데이터 통신

### 📌 **Backend**
- 🚀 **FastAPI** - RESTful API 구현
- 🐍 **Python** - 데이터 저장 및 PDF 변환 처리
- 📂 **JSON 파일** - 간단한 데이터 저장 및 유지
---------------------------

## ⚡ 실행 방법

### 1️⃣ 백엔드 실행 (FastAPI)
```
cd backend
venv\Scripts\activate
pip install -r requirements.txt  # 필요한 패키지 설치
uvicorn main:app --reload  # FastAPI 서버 실행
```
### 2️⃣ 프론트엔드 실행 (Vue.js)
```
cd frontend
npm install  # 패키지 설치
npm run dev  # 개발 서버 실행
```
### 2️⃣ 프론트엔드 실행 (Vue.js)
```
cd frontend
npm install  # 패키지 설치
npm run dev  # 개발 서버 실행
```
### 3️⃣ 웹 브라우저에서 실행
# 백엔드 (FastAPI) 실행 후:
```
http://127.0.0.1:8000
```
# 프론트엔드 (Vue.js) 실행 후:
```
http://localhost:5173
```
