import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MoodBadge } from "@/components/codriver/MoodBadge";
import { LapChart } from "@/components/codriver/LapChart";
import { SessionLog } from "@/components/codriver/SessionLog";
import {
  analyzeClip,
  mockAnalyze,
  pingBackend,
  USE_MOCK,
  type Analysis,
} from "@/lib/codriver";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Silent Co-Driver — F1 Radio Stress Dashboard" },
      {
        name: "description",
        content:
          "Race-engineering dashboard that transcribes driver radio calls and reads stress levels next to lap time data.",
      },
      { property: "og:title", content: "The Silent Co-Driver" },
      {
        property: "og:description",
        content: "Reading driver stress from radio calls, next to the lap times.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [lapTime, setLapTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const [recording, setRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    void pingBackend().then((h) => {
      setOnline(h !== null);
      if (h) setHistory([...h].reverse());
    });
  }, []);

  function pickFile(f: File | null) {
    if (!f) return;
    setFile(f);
    setError(null);
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        pickFile(new File([new Blob(chunks, { type: "audio/webm" })], "radio-call.webm"));
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setError("Microphone unavailable — upload a file instead.");
    }
  }

  async function onAnalyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      let data: Analysis;
      try {
        data = await analyzeClip(file, lapTime);
        setOnline(true);
      } catch (err) {
        if (!USE_MOCK) throw err;
        setOnline(false);
        await new Promise((r) => setTimeout(r, 900));
        data = mockAnalyze(lapTime, history.length);
      }
      setResult(data);
      setHistory((h) => [data, ...h]);
      setLapTime("");
    } catch {
      setError("Couldn't process that file — try a clearer clip.");
    } finally {
      setLoading(false);
    }
  }

  const chartItems = [...history].reverse();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold uppercase sm:text-6xl">The Silent Co-Driver</h1>
          <p className="mt-1 text-sm uppercase tracking-[0.25em] text-muted-foreground">
            Reading driver stress from radio calls
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 font-display text-xs uppercase tracking-widest">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: online ? "var(--calm)" : "var(--stressed)" }}
            aria-hidden
          />
          {online === null ? "Checking backend" : online ? "Backend connected" : "Backend offline"}
        </span>
      </header>
      <div className="racing-stripe mt-4" />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.85fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-2xl font-bold uppercase">Radio Input</h2>
            <div className="racing-stripe mt-2 mb-4" />

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pickFile(e.dataTransfer.files[0] ?? null);
              }}
              className="flex w-full flex-col items-center justify-center rounded-md border-2 border-dashed border-border px-4 py-10 text-center transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="font-display text-lg uppercase tracking-wider">
                Drag &amp; drop radio audio, or click to browse
              </span>
              <span className="mt-1 text-xs text-muted-foreground">.mp3 .wav .m4a</span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".mp3,.wav,.m4a,audio/*"
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />

            {file && (
              <div className="mt-4 rounded-md border border-border bg-background p-3">
                <p className="text-sm">
                  {file.name}{" "}
                  <span className="text-muted-foreground">
                    ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                </p>
                {audioUrl && <audio controls src={audioUrl} className="mt-2 w-full" />}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={toggleRecording}
                className="rounded-md border border-border px-4 py-2 font-display text-sm uppercase tracking-wider transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {recording ? "◼ Stop recording" : "🎙 Record from mic"}
              </button>
              <label className="flex items-center gap-2 text-sm">
                <span className="sr-only">Lap time</span>
                <input
                  value={lapTime}
                  onChange={(e) => setLapTime(e.target.value)}
                  placeholder="e.g. 1:32.450"
                  className="rounded-md border border-input bg-background px-3 py-2 font-display text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                />
              </label>
            </div>

            <div className="mt-5">
              {loading ? (
                <div className="flex items-center gap-4">
                  <div className="flex h-8 items-end gap-1" aria-hidden>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className="wave-bar w-1.5 rounded-sm bg-primary"
                        style={{ height: "100%", animationDelay: `${i * 0.12}s` }}
                      />
                    ))}
                  </div>
                  <p className="font-display uppercase tracking-widest text-muted-foreground">
                    Listening to the radio call...
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!file}
                  onClick={() => void onAnalyze()}
                  className="rounded-md bg-primary px-8 py-3 font-display text-lg font-bold uppercase tracking-widest text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  Analyze
                </button>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}
          </section>

          {result && (
            <section key={result.timestamp} className="rise-in rounded-lg border border-border bg-card p-5">
              <h2 className="text-2xl font-bold uppercase">Analysis</h2>
              <div className="racing-stripe mt-2 mb-4" />
              <blockquote className="border-l-2 border-primary bg-background px-4 py-3 font-mono text-sm italic text-foreground/90">
                "{result.transcript}"
              </blockquote>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <MoodBadge mood={result.mood} confidence={result.confidence} />
                <span className="font-display text-sm uppercase tracking-widest text-muted-foreground">
                  Lap {result.lap_time || "—"} ·{" "}
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <h3 className="mt-8 text-lg font-bold uppercase">Lap pace by mood</h3>
              <div className="racing-stripe mt-2 mb-4" />
              <LapChart items={chartItems} />
            </section>
          )}
        </div>

        <SessionLog items={history} onSelect={setResult} />
      </div>
    </main>
  );
}
