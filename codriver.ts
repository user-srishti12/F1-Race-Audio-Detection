export const BACKEND_URL = "http://localhost:8000";
/** When the local FastAPI backend is unreachable, fall back to mock analysis
 *  so the UI stays fully previewable. */
export const USE_MOCK = true;

export type Mood = "calm" | "stressed" | "tired";

export type Analysis = {
  transcript: string;
  mood: Mood;
  confidence: number;
  lap_time: string;
  timestamp: string;
};

export const MOOD_COLOR: Record<Mood, string> = {
  calm: "var(--calm)",
  stressed: "var(--stressed)",
  tired: "var(--tired)",
};

const MOCK_CLIPS: Array<{ transcript: string; mood: Mood; confidence: number; lap: string }> = [
  {
    transcript: "Box this lap, box box. Tyres are gone, I have no grip at all!",
    mood: "stressed",
    confidence: 0.91,
    lap: "1:34.812",
  },
  {
    transcript: "Copy that, balance feels good. Happy with the car right now.",
    mood: "calm",
    confidence: 0.86,
    lap: "1:32.450",
  },
  {
    transcript: "Yeah... understood. Long stint, legs are heavy in there.",
    mood: "tired",
    confidence: 0.78,
    lap: "1:33.604",
  },
];

export function mockAnalyze(lapTime: string, index: number): Analysis {
  const clip = MOCK_CLIPS[index % MOCK_CLIPS.length]!;
  return {
    transcript: clip.transcript,
    mood: clip.mood,
    confidence: clip.confidence,
    lap_time: lapTime || clip.lap,
    timestamp: new Date().toISOString(),
  };
}

export function lapToSeconds(lap: string): number | null {
  if (!lap) return null;
  const m = lap.trim().match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  return (m[1] ? Number(m[1]) * 60 : 0) + Number(m[2]);
}

export async function pingBackend(): Promise<Analysis[] | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/history`);
    if (!res.ok) return null;
    return (await res.json()) as Analysis[];
  } catch {
    return null;
  }
}

export async function analyzeClip(file: File, lapTime: string): Promise<Analysis> {
  const form = new FormData();
  form.append("audio", file);
  if (lapTime) form.append("lap_time", lapTime);
  const res = await fetch(`${BACKEND_URL}/analyze`, { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail ?? "Couldn't process that file — try a clearer clip.");
  }
  return (await res.json()) as Analysis;
}