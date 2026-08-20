import { MOOD_COLOR, lapToSeconds, type Analysis } from "@/lib/codriver";

export function LapChart({ items }: { items: Analysis[] }) {
  const points = items
    .map((a, i) => ({ a, i, secs: lapToSeconds(a.lap_time) }))
    .filter((p): p is { a: Analysis; i: number; secs: number } => p.secs !== null);

  if (points.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add lap times to plot stress against pace.
      </p>
    );
  }

  const max = Math.max(...points.map((p) => p.secs));
  const min = Math.min(...points.map((p) => p.secs));
  const span = Math.max(max - min, 0.6);

  return (
    <div>
      <div className="flex h-44 items-end gap-3" role="img" aria-label="Lap times by clip mood">
        {points.map((p) => {
          const px = 40 + ((p.secs - min) / span) * 90;
          return (
            <div
              key={p.a.timestamp + p.i}
              className="flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <span className="font-display text-xs text-muted-foreground">{p.a.lap_time}</span>
              <div
                className="w-full rounded-t-sm transition-all"
                style={{
                  height: `${px}px`,
                  backgroundColor: MOOD_COLOR[p.a.mood],
                  boxShadow: `0 0 18px color-mix(in oklch, ${MOOD_COLOR[p.a.mood]} 35%, transparent)`,
                }}
                title={`${p.a.mood} — ${p.a.lap_time}`}
              />
              <span className="font-display text-[11px] uppercase text-muted-foreground">
                #{p.i + 1}
              </span>
            </div>
          );
        })}
      </div>
      <ul className="mt-4 flex flex-wrap gap-4 text-xs uppercase tracking-wider text-muted-foreground">
        {(["calm", "stressed", "tired"] as const).map((m) => (
          <li key={m} className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: MOOD_COLOR[m] }}
              aria-hidden
            />
            {m}
          </li>
        ))}
      </ul>
    </div>
  );
}