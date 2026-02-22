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

# ----------------------------
# Setup Upload Directory
# ----------------------------
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ----------------------------
# Load Embedding Model (loads once)
# ----------------------------
model = SentenceTransformer("all-MiniLM-L6-v2")

# In-memory storage (temporary for demo)
stored_chunks = []
stored_embeddings = []


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
# Upload Endpoint
# ----------------------------
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    global stored_chunks, stored_embeddings

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # Save uploaded file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Read PDF
    reader = PdfReader(file_path)
    text = ""

    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted

    # Chunk text
    chunks = chunk_text(text)

    # Generate embeddings
    embeddings = model.encode(chunks)

    # Store in memory
    stored_chunks = chunks
    stored_embeddings = embeddings

    return {
        "filename": file.filename,
        "total_chunks": len(chunks),
        "embedding_dimension": len(embeddings[0]) if len(embeddings) > 0 else 0
    }


# ----------------------------
# Ask Endpoint
# ----------------------------
@app.post("/ask")
async def ask_question(question: str):
    global stored_chunks, stored_embeddings

    if not stored_chunks:
        return {"error": "No document uploaded yet."}

    # Embed question
    question_embedding = model.encode([question])[0]

    # Similarity search (dot product)
    similarities = np.dot(stored_embeddings, question_embedding)

    best_match_index = np.argmax(similarities)

    best_chunk = stored_chunks[best_match_index]

    return {
        "question": question,
        "best_match_chunk": best_chunk[:1000]
    }
