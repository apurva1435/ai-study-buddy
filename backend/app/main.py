from fastapi import FastAPI, UploadFile, File
from pypdf import PdfReader
import shutil
import os

app = FastAPI(
    title="AI Study Buddy API",
    version="1.0.0"
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ----------------------------
# Chunking Function
# ----------------------------
def chunk_text(text, chunk_size=800, overlap=100):
    chunks = []
    start = 0
    text_length = len(text)

    while start < text_length:
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start += chunk_size - overlap

    return chunks


# ----------------------------
# Basic Endpoints
# ----------------------------
@app.get("/")
def read_root():
    return {"message": "AI Study Buddy Backend Running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# ----------------------------
# Upload + Extract + Chunk
# ----------------------------
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text from PDF
    reader = PdfReader(file_path)
    text = ""

    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted

    # Chunk text
    chunks = chunk_text(text)

    return {
        "filename": file.filename,
        "message": "File uploaded successfully",
        "total_chunks": len(chunks),
        "first_chunk_preview": chunks[0][:500] if chunks else ""
    }