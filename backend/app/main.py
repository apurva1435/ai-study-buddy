from fastapi import FastAPI, UploadFile, File
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
import shutil
import os
import numpy as np

app = FastAPI(
    title="AI Study Buddy API",
    version="1.0.0"
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Load embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

# In-memory storage
stored_chunks = []
stored_embeddings = []


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


@app.get("/")
def read_root():
    return {"message": "AI Study Buddy Backend Running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    global stored_chunks, stored_embeddings

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    reader = PdfReader(file_path)
    text = ""

    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted

    chunks = chunk_text(text)

    embeddings = model.encode(chunks)

    stored_chunks = chunks
    stored_embeddings = embeddings

    return {
        "filename": file.filename,
        "total_chunks": len(chunks),
        "embedding_dimension": len(embeddings[0]) if len(embeddings) > 0 else 0
    }


@app.post("/ask")
async def ask_question(question: str):
    global stored_chunks, stored_embeddings

    if not stored_chunks:
        return {"error": "No document uploaded yet."}

    question_embedding = model.encode([question])[0]

    similarities = np.dot(stored_embeddings, question_embedding)

    best_match_index = np.argmax(similarities)

    best_chunk = stored_chunks[best_match_index]

    return {
        "question": question,
        "best_match_chunk": best_chunk[:1000]
    }
