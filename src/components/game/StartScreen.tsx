import { InfinityMark } from "@/components/game/Mark";
import { unlockAudio } from "@/lib/game/audio";
import { CHARS, type CharId } from "@/lib/game/characters";
import type { Meta } from "@/lib/game/meta";
import { cn } from "@/lib/utils";

function clock(t: number) {
  const s = Math.floor(t);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

export function StartScreen({
  booting,
  meta,
  selected,
  onSelect,
  onStart,
}: {
  booting?: boolean;
  meta: Meta;
  selected: CharId;
  onSelect: (id: CharId) => void;
  onStart: (id: CharId) => void;
}) {
  const cur = CHARS.find((c) => c.id === selected) ?? CHARS[0]!;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-ink text-paper">
      <img
        src="/art/bg.jpg"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#08080cf0_0%,#08080c88_42%,#08080cf2_100%)]" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pb-[max(1.2rem,env(safe-area-inset-bottom))] pt-[max(1.2rem,env(safe-area-inset-top))] sm:px-8">
        <header className="mb-3 flex shrink-0 items-end justify-between gap-3 sm:mb-6">
          <div>
            <div className="mb-2 flex items-center gap-3 text-ice">
              <InfinityMark className="h-6 w-14" />
              <span className="text-xs tracking-[0.32em] text-mute">LIMITLESS</span>
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
              选人
              <span className="ml-2 text-lg font-normal text-mute sm:text-2xl">点出战进场</span>
            </h1>
          </div>
          {meta.runs > 0 && (
            <p className="text-xs tabular-nums text-mute">
              最佳 {clock(meta.bestTime)} · {meta.bestKills} 斩
            </p>
          )}
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 sm:gap-5">
          {CHARS.map((c) => {
            const on = selected === c.id;
            const ice = c.accent === "ice";
            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  unlockAudio();
                  onSelect(c.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(c.id);
                  }
                }}
                className={cn(
                  "relative flex min-h-40 cursor-pointer overflow-hidden rounded-xl border text-left sm:min-h-80",
                  on
                    ? ice
                      ? "border-ice bg-ink-2"
                      : "border-blood bg-ink-2"
                    : "border-line bg-ink/70",
                )}
              >
                <img
                  src={c.portrait}
                  alt=""
                  className={cn(
                    "pointer-events-none absolute inset-y-0 right-0 h-full w-1/2 object-cover object-top sm:w-3/5",
                    ice ? "mix-blend-lighten" : "opacity-90",
                  )}
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#08080cf2_38%,transparent_82%)]" />
                <div className="relative z-10 flex w-full flex-col justify-end p-3 sm:p-5">
                  <p className={cn("text-xs tracking-[0.28em]", ice ? "text-ice" : "text-blood")}>
                    {c.kana}
                  </p>
                  <p className="mt-1 font-display text-3xl font-semibold leading-none sm:text-5xl">
                    {c.name}
                  </p>
                  <p className="mt-1 text-xs text-mute sm:mt-2 sm:text-sm">{c.title}</p>
                  <p className="mt-1 hidden max-w-xs text-xs leading-relaxed text-mute sm:mt-2 sm:block sm:text-sm">
                    {c.blurb}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3">
                    {c.kit.map((k) => (
                      <span
                        key={k}
                        className="rounded-sm border border-line bg-ink px-2 py-1 text-xs text-paper"
                      >
                        {k}
                      </span>
                    ))}
                    <span className="rounded-sm border border-line bg-ink px-2 py-1 text-xs text-paper">
                      {c.dashName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      unlockAudio();
                      onSelect(c.id);
                      onStart(c.id);
                    }}
                    className={cn(
                      "mt-3 h-11 w-28 rounded-lg text-sm font-medium text-ink",
                      ice ? "bg-paper hover:bg-ice" : "bg-paper hover:bg-blood hover:text-paper",
                    )}
                  >
                    出战
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex shrink-0 flex-col gap-2 sm:mt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-mute">
            位移 {cur.dashName} · WASD / 摇杆走位 · {cur.name}
          </p>
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              onStart(selected);
            }}
            className={cn(
              "h-12 min-w-44 rounded-lg px-6 text-sm font-medium text-ink",
              cur.accent === "ice" ? "bg-paper hover:bg-ice" : "bg-paper hover:bg-blood hover:text-paper",
            )}
          >
            以 {cur.name} 进入领域
          </button>
        </div>
      </div>
    </div>
  );
}
