from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer

import shutil
import os
import sys
import numpy as np

from dotenv import load_dotenv
import google.generativeai as genai

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from database import conn, cursor

app = FastAPI(
    title="AI Study Buddy API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- GEMINI ----------------

load_dotenv()

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

gemini_model = genai.GenerativeModel("gemini-2.5-flash")


UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Load embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

# In-memory storage
stored_chunks = []
stored_embeddings = []


class ChatRequest(BaseModel):
    message: str
    context: dict = {}


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

    page_chunks = []

    for page_number, page in enumerate(reader.pages, start=1):
        extracted = page.extract_text()

        if extracted:
            chunks = chunk_text(extracted)

            for chunk in chunks:
                page_chunks.append({
                    "text": chunk,
                    "page": page_number,
                })
    stored_chunks = page_chunks

    texts = [chunk["text"] for chunk in page_chunks]

    stored_embeddings = model.encode(texts)

    return {
        "filename": file.filename,
        "total_chunks": len(page_chunks),
        "embedding_dimension": len(stored_embeddings[0]) if len(stored_embeddings) > 0 else 0
    }


@app.post("/ask")
async def ask_question(question: str):
    global stored_chunks, stored_embeddings

    if not stored_chunks:
        return {"error": "No document uploaded yet."}

    question_embedding = model.encode([question])[0]

    similarities = np.dot(
        stored_embeddings,
        question_embedding
    )

    best_match_index = np.argmax(similarities)

    best_chunk = stored_chunks[best_match_index]["text"]

    top_indices = np.argsort(similarities)[-3:]

    context = ""
    source_pages = []

    for index in reversed(top_indices):
        context += stored_chunks[index]["text"]
        context += "\n\n"

        source_pages.append(
            stored_chunks[index]["page"]
        )

    return {
        "question": question,
        "best_match_chunk": best_chunk[:1000]
    }

class SessionRequest(BaseModel):
    subject: str
    duration: int
    focus_score: float

@app.post("/session")
def save_session(request: SessionRequest):

    cursor.execute(
        """
        INSERT INTO sessions
        (subject, duration, focus_score)
        VALUES (?, ?, ?)
        """,
        (
            request.subject,
            request.duration,
            request.focus_score,
        )
    )

    conn.commit()

    return {
        "message": "Session saved successfully"
    }

@app.get("/analytics")
def get_analytics():

    cursor.execute(
        """
        SELECT
        COUNT(*),
        SUM(duration),
        AVG(focus_score)
        FROM sessions
        """
    )

    data = cursor.fetchone()

    return {
        "total_sessions": data[0] if data[0] else 0,
        "total_duration": data[1] if data[1] else 0,
        "average_focus_score": round(data[2], 2) if data[2] else 0
    }


@app.post("/api/chat")
async def chat(request: ChatRequest):
    global stored_chunks, stored_embeddings

    if not stored_chunks:
        return {
            "reply": "Please upload a PDF first."
        }

    # Find the most relevant chunk
    question_embedding = model.encode([request.message])[0]

    similarities = np.dot(
        stored_embeddings,
        question_embedding
    )

    # Retrieve the TOP 3 most relevant chunks
    top_indices = np.argsort(similarities)[-3:]

    context = ""
    source_pages=[]
    for index in reversed(top_indices):
        context += stored_chunks[index]["text"]
        context += "\n\n"

        source_pages.append(
            stored_chunks[index]["page"]
        )

    print("\n========== BEST CHUNK ==========")
    print(context)
    print("================================\n")

    # Prompt Gemini
    prompt = f"""
You are an intelligent AI Study Buddy.

You must answer ONLY using the uploaded study material.

Rules:
1. Never invent information.
2. If the answer is not present in the document, reply:
   "I could not find that information in the uploaded document."
3. Explain concepts in simple student-friendly language.
4. Keep answers between 100 and 200 words.
5. Use bullet points whenever appropriate.
6. If the question asks for steps or a process, answer step-by-step.
7. If the user asks for a definition, first give a one-line definition and then explain it.

Document Context:
--------------------
{context}
--------------------

Student Question:
{request.message}

Format your answer exactly like this:

Definition:
...

Explanation:
...

Key Points:
• ...
• ...
• ...

"""

    try:
        response = gemini_model.generate_content(prompt)

        pages = sorted(set(source_pages))

        page_text = "\n ".join(
            f"Page {page}" for page in pages
        )

        return {
            "reply": response.text + f"\n\n📄 Source: {page_text}"
        }

    except Exception as e:
        return {
            "reply": f"Gemini Error: {str(e)}"
        }