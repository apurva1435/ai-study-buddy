from fastapi import FastAPI

app = FastAPI(
    title="AI Study Buddy API",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {"message": "AI Study Buddy Backend Running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}