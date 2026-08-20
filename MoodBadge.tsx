import type { Mood } from "@/lib/codriver";
import { MOOD_COLOR } from "@/lib/codriver";

export function MoodBadge({
  mood,
  confidence,
  size = "lg",
}: {
  mood: Mood;
  confidence: number;
  size?: "lg" | "sm";
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-display font-bold uppercase tracking-widest ${
        size === "lg" ? "px-5 py-2 text-xl" : "px-3 py-1 text-xs"
      }`}
      style={{
        color: MOOD_COLOR[mood],
        backgroundColor: `color-mix(in oklch, ${MOOD_COLOR[mood]} 18%, transparent)`,
        border: `1px solid color-mix(in oklch, ${MOOD_COLOR[mood]} 55%, transparent)`,
      }}
    >
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: MOOD_COLOR[mood] }}
        aria-hidden
      />
      {mood} · {Math.round(confidence * 100)}%
    </span>
  );
}