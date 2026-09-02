import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { InfinityMark } from "@/components/game/Mark";
import { publicUrl } from "@/lib/game/asset-url";
import { unlockAudio, setMuted } from "@/lib/game/audio";
import { CHARS, type CharId } from "@/lib/game/characters";
import { formatClock } from "@/lib/game/format";
import { CLEAR_TIME } from "@/lib/game/horde";
import { isCharUnlocked, setMutedMeta, type Meta } from "@/lib/game/meta";
import { NOTES } from "@/lib/game/notes";
import { cn } from "@/lib/utils";

export function StartScreen({
  meta,
  selected,
  onSelect,
  onStart,
  onMute,
}: {
  booting?: boolean;
  meta: Meta;
  selected: CharId;
  onSelect: (id: CharId) => void;
  onStart: (id: CharId) => void;
  onMute?: (muted: boolean) => void;
}) {
  const cur = CHARS.find((c) => c.id === selected) ?? CHARS[0]!;
  const [archive, setArchive] = useState(false);
  const playable = isCharUnlocked(selected, meta);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-ink text-paper">
      <img
        src={publicUrl("art/bg.jpg")}
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
            <p className="mt-2 text-xs text-mute">同人作品，与官方无关。</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {meta.runs > 0 && (
              <p className="text-xs tabular-nums text-mute">
                最佳 {formatClock(meta.bestTime)} · {meta.bestKills} 斩
                {meta.cleared ? " · 通关" : ""}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                aria-label={meta.muted ? "打开声音" : "静音"}
                onClick={() => {
                  const next = !meta.muted;
                  setMuted(next);
                  setMutedMeta(next);
                  if (!next) unlockAudio();
                  onMute?.(next);
                }}
                className="flex size-10 items-center justify-center rounded-md border border-line bg-ink-2"
              >
                {meta.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
              <button
                type="button"
                onClick={() => setArchive((v) => !v)}
                className="h-10 rounded-md border border-line bg-ink-2 px-3 text-xs text-paper"
              >
                档案
              </button>
            </div>
          </div>
        </header>

        {archive ? (
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-line bg-ink/70 p-4">
            <p className="mb-3 text-xs tracking-[0.22em] text-ice">档案</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {NOTES.map((n) => {
                const open = meta.notes.includes(n.id);
                return (
                  <article key={n.id} className="rounded-lg border border-line bg-ink-2 p-4">
                    <p className="text-sm text-paper">{open ? n.title : "？？？"}</p>
                    <p className="mt-2 text-xs leading-relaxed text-mute">
                      {open ? n.body : "还没写上。去割。"}
                    </p>
                  </article>
                );
              })}
            </div>
            <div className="mt-4 text-xs text-mute">
              {meta.extraStart ? "起手加一已开。苍 / 捌会先到手。" : "活过一分半或通关，起手加一。"}
            </div>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 sm:gap-5">
            {CHARS.map((c) => {
              const on = selected === c.id;
              const ice = c.accent === "ice";
              const locked = !isCharUnlocked(c.id, meta);
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
                      locked && "grayscale",
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
                    <p className="mt-1 text-xs text-mute sm:mt-2 sm:text-sm">
                      {locked ? c.unlockHint ?? "先活一场。" : c.title}
                    </p>
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
                      disabled={locked}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (locked) return;
                        unlockAudio();
                        onSelect(c.id);
                        onStart(c.id);
                      }}
                      className={cn(
                        "mt-3 h-11 w-28 rounded-lg text-sm font-medium",
                        locked
                          ? "bg-ink-3 text-mute"
                          : ice
                            ? "bg-paper text-ink hover:bg-ice"
                            : "bg-paper text-ink hover:bg-blood hover:text-paper",
                      )}
                    >
                      {locked ? "未开" : "出战"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex shrink-0 flex-col gap-2 sm:mt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-mute">
            {archive
              ? "割完再翻。纸比人老实。"
              : `右键点地走。Q ${cur.dashName}，E ${cur.id === "gojo" ? "虚式" : "开"}，R 术域 · 活过 ${formatClock(CLEAR_TIME)}`}
          </p>
          <button
            type="button"
            disabled={!playable}
            onClick={() => {
              if (!playable) return;
              unlockAudio();
              onStart(selected);
            }}
            className={cn(
              "h-12 min-w-44 rounded-lg px-6 text-sm font-medium",
              playable
                ? cur.accent === "ice"
                  ? "bg-paper text-ink hover:bg-ice"
                  : "bg-paper text-ink hover:bg-blood hover:text-paper"
                : "bg-ink-3 text-mute",
            )}
          >
            {playable ? `以 ${cur.name} 进入领域` : cur.unlockHint ?? "先活一场。"}
          </button>
        </div>
      </div>
    </div>
  );
}
