# The Silent Co-Driver
Link :https://radio-calm-coach.lovable.app
F1 race-engineering dashboard that turns driver radio calls into a transcript plus a
stress reading, plotted next to lap times.

## 1. Backend (FastAPI + local Hugging Face models)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

First start downloads `openai/whisper-tiny` and
`j-hartmann/emotion-english-distilroberta-base` (~200 MB). After that it runs fully
offline - no API keys, no rate limits.

Endpoints: `POST /analyze` (multipart `audio`, optional `lap_time`), `GET /history`.

## 2. Frontend

```bash
npm install
npm run dev
```

Open the printed URL. The status pill top-right shows whether the backend is reachable.

## 3. Mock mode

If the backend is offline the UI falls back to a mock analysis so the demo still runs.
Toggle `USE_MOCK` in `src/lib/codriver.ts` to disable it; `BACKEND_URL` in the same file
sets the API base URL.

## Demo flow

Upload (or record) a radio clip -> optional lap time -> ANALYZE -> transcript, mood badge,
lap-pace chart colored by mood, and a clickable session log.
