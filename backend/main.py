# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import rawdata, pdf, forms, tests  # tests 추가

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(rawdata.router)
app.include_router(pdf.router)
app.include_router(forms.router)
app.include_router(tests.router)  # 새 라우터 추가

@app.get("/")
def root():
    return {"message": "Rawdata Web API"}