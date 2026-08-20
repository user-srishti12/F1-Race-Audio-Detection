"""The Silent Co-Driver - FastAPI backend.

Run: uvicorn main:app --reload --port 8000
"""

import os
import tempfile
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline

app = FastAPI(title="The Silent Co-Driver")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev: any local frontend port (5173, 8080, ...)
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session history (no database by design).
HISTORY: List[dict] = []

ALLOWED_EXT = {".mp3", ".wav", ".m4a", ".webm", ".ogg"}

EMOTION_MAP = {
    "anger": "stressed",
    "fear": "stressed",
    "disgust": "stressed",
    "sadness": "tired",
    "joy": "calm",
    "neutral": "calm",
    "surprise": "calm",
}

# Loaded once at startup, not per request.
print("Loading models (first run downloads weights)...")
asr = pipeline("automatic-speech-recognition", model="openai/whisper-tiny")
emotion = pipeline(
    "text-classification", model="j-hartmann/emotion-english-distilroberta-base"
)
print("Models ready.")


@app.get("/history")
def get_history() -> List[dict]:
    return HISTORY


@app.post("/analyze")
async def analyze(audio: UploadFile = File(...), lap_time: Optional[str] = Form(None)):
    ext = os.path.splitext(audio.filename or "")[1].lower()
    if ext and ext not in ALLOWED_EXT:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {ext}")

    data = await audio.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty audio file.")

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext or ".wav") as tmp:
            tmp.write(data)
            tmp_path = tmp.name

        try:
            transcript = (asr(tmp_path) or {}).get("text", "").strip()
        except Exception as exc:  # corrupt / undecodable audio
            raise HTTPException(
                status_code=422, detail=f"Couldn't decode that audio clip: {exc}"
            )

        if not transcript:
            raise HTTPException(
                status_code=422, detail="No speech detected - try a clearer clip."
            )

        try:
            top = emotion(transcript)[0]
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Emotion model failed: {exc}")

        result = {
            "transcript": transcript,
            "mood": EMOTION_MAP.get(top["label"].lower(), "calm"),
            "confidence": float(top["score"]),
            "lap_time": lap_time or "",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        HISTORY.append(result)
        return result
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
