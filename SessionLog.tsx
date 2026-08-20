import { MOOD_COLOR, type Analysis } from "@/lib/codriver";

export function SessionLog({
  items,
  onSelect,
}: {
  items: Analysis[];
  onSelect: (a: Analysis) => void;
}) {
  return (
    <aside className="rounded-lg border border-border bg-sidebar p-5">
      <h2 className="text-2xl font-bold uppercase">Session Log</h2>
      <div className="racing-stripe mt-2 mb-4" />
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No clips analyzed yet — upload your first radio call.
        </p>
      ) : (
        <ul className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
          {items.map((a, i) => (
            <li key={a.timestamp + i}>
              <button
                type="button"
                onClick={() => onSelect(a)}
                className="w-full rounded-md border border-border bg-card p-3 text-left transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: MOOD_COLOR[a.mood] }}
                    aria-hidden
                  />
                  <span
                    className="font-display text-xs uppercase tracking-widest"
                    style={{ color: MOOD_COLOR[a.mood] }}
                  >
                    {a.mood}
                  </span>
                  <span className="ml-auto font-display text-xs text-muted-foreground">
                    {a.lap_time || "—"}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-foreground/85">"{a.transcript}"</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(a.timestamp).toLocaleTimeString()}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}