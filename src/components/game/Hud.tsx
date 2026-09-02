import { Eye, EyeOff, Volume2, VolumeX } from "lucide-react";
import { formatCE, formatRate } from "@/lib/game/format";
import { setMuted, unlockAudio } from "@/lib/game/audio";
import { useGame } from "@/lib/game/store";

export function Hud() {
  const energy = useGame((s) => s.energy);
  const derived = useGame((s) => s.derived);
  const combo = useGame((s) => s.combo);
  const line = useGame((s) => s.line);
  const muted = useGame((s) => s.muted);
  const prestige = useGame((s) => s.prestige);
  const toggleMute = useGame((s) => s.toggleMute);

  return (
    <header className="relative z-20 flex shrink-0 items-start justify-between gap-3 px-4 pb-2 pt-[max(0.7rem,env(safe-area-inset-top))] sm:px-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-sm border border-line bg-ink-2 px-2 py-0.5 text-xs tracking-[0.18em] text-ice">
            阶位 {derived.rank.name}
          </span>
          {prestige > 0 && (
            <span className="text-xs text-mute">残核 {prestige}</span>
          )}
          {combo > 1 && (
            <span className="font-mono text-xs tabular-nums text-paper">
              连击 {combo}
            </span>
          )}
        </div>
        <p className="mt-1 font-display text-2xl font-semibold tabular-nums leading-none tracking-tight text-paper sm:text-3xl">
          {formatCE(energy)}
          <span className="ml-2 text-sm font-normal text-mute">咒力</span>
        </p>
        <p className="mt-1 text-xs tabular-nums text-ice-dim">{formatRate(derived.idle)}</p>
        <p className="mt-1 truncate text-xs text-mute">{line}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label={muted ? "打开声音" : "静音"}
          onClick={() => {
            toggleMute();
            const next = !muted;
            setMuted(next);
            if (!next) unlockAudio();
          }}
          className="flex size-11 items-center justify-center rounded-md border border-line bg-ink-2 text-paper"
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
        <span className="hidden text-ice sm:flex" aria-hidden>
          {derived.domainActive ? <Eye className="size-5" /> : <EyeOff className="size-5 opacity-50" />}
        </span>
      </div>
    </header>
  );
}
