from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import rawdata, pdf

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우트 등록
app.include_router(rawdata.router)
app.include_router(pdf.router)

@app.get("/")
def root():
    return {"message": "Rawdata Web API"}