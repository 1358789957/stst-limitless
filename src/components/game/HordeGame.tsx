import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { loadAtlas } from "@/lib/game/atlas";
import { resumeAudio, setMuted, unlockAudio } from "@/lib/game/audio";
import { CHAR_MAP, type CharId } from "@/lib/game/characters";
import { formatClock } from "@/lib/game/format";
import { HordeSim, type HudSnap } from "@/lib/game/horde";
import { loadMeta, recordRun, setMutedMeta } from "@/lib/game/meta";
import { UPGRADE_MAP, type UpgradeId } from "@/lib/game/upgrades";
import { cn } from "@/lib/utils";

function SkillButton({
  label,
  ready,
  cd,
  max,
  onClick,
  accent,
}: {
  label: string;
  ready: boolean;
  cd: number;
  max: number;
  onClick: () => void;
  accent: "ice" | "blood" | "paper";
}) {
  const t = max > 0 ? Math.max(0, Math.min(1, 1 - cd / max)) : 1;
  const ring =
    accent === "blood" ? "#c44c4c" : accent === "ice" ? "#7ee8e4" : "#efe8d8";
  return (
    <button
      type="button"
      disabled={!ready}
      onClick={onClick}
      className={cn(
        "relative h-14 min-w-14 overflow-hidden rounded-full border px-3 text-sm font-medium",
        ready ? "border-line bg-paper text-ink" : "border-line bg-ink-2 text-mute",
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: `conic-gradient(${ring} ${t * 360}deg, transparent 0deg)`,
        }}
      />
      <span className="relative z-10">{ready ? label : Math.ceil(cd)}</span>
    </button>
  );
}

export function HordeGame({
  charId,
  extraStart,
  onExit,
}: {
  charId: CharId;
  extraStart?: boolean;
  onExit: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef(new HordeSim(charId, { extraStart }));
  const stickId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const [hud, setHud] = useState<HudSnap>(() => simRef.current.hud());
  const [ready, setReady] = useState(false);
  const [muted, setMutedState] = useState(() => loadMeta().muted);
  const [stick, setStick] = useState({ active: false, x: 0, y: 0 });
  const [unlocks, setUnlocks] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    loadAtlas().then((atlas) => {
      if (!alive) return;
      simRef.current.atlas = atlas;
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const sim = simRef.current;
    const onDown = (e: KeyboardEvent) => {
      if (e.code === "Escape" || e.code === "KeyP") {
        e.preventDefault();
        unlockAudio();
        sim.togglePause();
        setHud(sim.hud());
        return;
      }
      if (sim.over && e.code === "KeyR") {
        e.preventDefault();
        retry();
        return;
      }
      if (e.repeat) return;
      if (e.code === "Space") e.preventDefault();
      sim.keys.add(e.code);
      unlockAudio();
    };
    const onUp = (e: KeyboardEvent) => {
      sim.keys.delete(e.code);
    };
    const clear = () => sim.keys.clear();
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", clear);
    };
  }, []);

  useEffect(() => {
    const sim = simRef.current;
    const probe = {
      getYaw: () => sim.getYaw(),
      getSpeed: () => sim.getSpeed(),
      getX: () => sim.getX(),
      setKeys: (codes: string[]) => sim.setKeys(codes),
      setSteer: (v: number) => {
        sim.stickX = -v;
        sim.stickY = 0;
      },
    };
    window.__controlsTest = probe;
    window.__hordeTest = {
      offer: () => {
        sim.offer();
        return sim.hud();
      },
      finish: (won: boolean) => {
        sim.finish(won);
        return sim.hud();
      },
      choose: (id: string) => {
        sim.choose(id as UpgradeId);
        return sim.hud();
      },
      hud: () => sim.hud(),
    };
    return () => {
      if (window.__controlsTest === probe) delete window.__controlsTest;
      if (window.__hordeTest) delete window.__hordeTest;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    const sim = simRef.current;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let hudAcc = 0;
    const STEP = 1 / 60;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.1) dt = 0.1;
      acc += dt;
      let steps = 0;
      while (acc >= STEP && steps < 5) {
        sim.tick(STEP);
        acc -= STEP;
        steps += 1;
      }
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = cvs.clientWidth;
      const h = cvs.clientHeight;
      if (cvs.width !== Math.floor(w * dpr) || cvs.height !== Math.floor(h * dpr)) {
        cvs.width = Math.floor(w * dpr);
        cvs.height = Math.floor(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sim.render(ctx, w, h);
      hudAcc += dt;
      if (hudAcc > 0.08 || sim.paused || sim.over) {
        hudAcc = 0;
        const snap = sim.hud();
        setHud(snap);
        if (snap.over && !sim.recorded) {
          sim.recorded = true;
          const out = recordRun({
            kills: snap.kills,
            time: snap.time,
            level: snap.level,
            won: snap.won,
            charId: snap.charId,
            usedDomain: sim.usedDomain,
            sawBoss: sim.sawBoss,
          });
          setUnlocks(out.unlocked);
        }
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        const sim = simRef.current;
        if (!sim.over && !sim.picks && !sim.userPaused) {
          sim.togglePause();
          setHud(sim.hud());
        }
      } else {
        resumeAudio();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  function retry() {
    unlockAudio();
    const extra = loadMeta().extraStart;
    simRef.current.reset(charId, { extraStart: extra });
    setUnlocks([]);
    setHud(simRef.current.hud());
  }

  function setStickFrom(clientX: number, clientY: number, originX: number, originY: number) {
    const dx = clientX - originX;
    const dy = clientY - originY;
    const mag = Math.hypot(dx, dy);
    const max = 46;
    const nx = mag > 0.001 ? dx / mag : 0;
    const ny = mag > 0.001 ? dy / mag : 0;
    const clamped = Math.min(1, mag / max);
    simRef.current.stickX = nx * clamped;
    simRef.current.stickY = ny * clamped;
    setStick({
      active: true,
      x: nx * clamped * max,
      y: ny * clamped * max,
    });
  }

  const ch = CHAR_MAP[hud.charId];
  const ice = ch.accent === "ice";
  const blocking = Boolean(hud.picks || hud.userPaused || hud.over);

  return (
    <div className="relative h-dvh overflow-hidden bg-ink text-paper">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      {!ready && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink text-sm text-mute">
          术式展开中…
        </div>
      )}

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-[max(0.55rem,env(safe-area-inset-top))]">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-ink-3">
              <div
                className="h-full rounded-full bg-blood"
                style={{ width: `${Math.max(0, (hud.hp / Math.max(1, hud.maxHp)) * 100)}%` }}
              />
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink-3">
              <div
                className="h-full rounded-full bg-ice"
                style={{ width: `${Math.max(0, (hud.xp / Math.max(1, hud.need)) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs tabular-nums text-mute">
              祓除 {hud.kills} · 第 {hud.wave} 波 · Lv. {hud.level}
            </p>
            <p className="truncate text-xs text-ice">{hud.line}</p>
          </div>
          <div className="pointer-events-none flex min-w-[4.6rem] flex-col items-center pt-0.5">
            <p className="font-display text-2xl tabular-nums leading-none text-paper">
              {formatClock(hud.time)}
            </p>
            <div className="mt-1 h-0.5 w-14 overflow-hidden rounded-full bg-ink-3">
              <div
                className="h-full rounded-full bg-paper"
                style={{
                  width: `${Math.max(0, Math.min(100, (hud.time / Math.max(1, hud.clearTime)) * 100))}%`,
                }}
              />
            </div>
            <p className="mt-0.5 text-[10px] text-mute">收束 {formatClock(hud.clearTime)}</p>
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              aria-label={muted ? "打开声音" : "静音"}
              onClick={() => {
                const next = !muted;
                setMutedState(next);
                setMuted(next);
                setMutedMeta(next);
                if (!next) unlockAudio();
              }}
              className="flex size-11 items-center justify-center rounded-md border border-line bg-ink-2"
            >
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
            <button
              type="button"
              aria-label={hud.userPaused ? "恢复游戏" : "暂停"}
              onClick={() => {
                unlockAudio();
                simRef.current.togglePause();
                setHud(simRef.current.hud());
              }}
              className="flex size-11 items-center justify-center rounded-md border border-line bg-ink-2"
            >
              {hud.userPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
            </button>
          </div>
        </div>
        {hud.weps.filter((w) => w.id !== "limitless" && w.id !== "slash").length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {hud.weps
              .filter((w) => w.id !== "limitless" && w.id !== "slash")
              .map((w) => (
                <span key={w.id} className="rounded-sm bg-ink-2/90 px-2 py-0.5 text-[11px] text-mute">
                  {UPGRADE_MAP[w.id]?.name ?? w.id} {w.lv}
                </span>
              ))}
          </div>
        )}
      </header>

      <div
        className="absolute bottom-0 left-0 z-10 h-52 w-[46%] touch-none md:pointer-events-none"
        onPointerDown={(e) => {
          if (blocking) return;
          if (e.pointerType === "mouse") return;
          unlockAudio();
          stickId.current = e.pointerId;
          origin.current = { x: e.clientX, y: e.clientY };
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          setStickFrom(e.clientX, e.clientY, e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (stickId.current !== e.pointerId) return;
          setStickFrom(e.clientX, e.clientY, origin.current.x, origin.current.y);
        }}
        onPointerUp={(e) => {
          if (stickId.current !== e.pointerId) return;
          stickId.current = null;
          simRef.current.stickX = 0;
          simRef.current.stickY = 0;
          setStick({ active: false, x: 0, y: 0 });
        }}
        onPointerCancel={() => {
          stickId.current = null;
          simRef.current.stickX = 0;
          simRef.current.stickY = 0;
          setStick({ active: false, x: 0, y: 0 });
        }}
      >
        <div className="pointer-events-none absolute bottom-[max(1.4rem,env(safe-area-inset-bottom))] left-5 size-28 rounded-full border border-line bg-ink-2/70 md:hidden">
          <div
            className="absolute left-1/2 top-1/2 size-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper"
            style={{
              transform: `translate(calc(-50% + ${stick.x}px), calc(-50% + ${stick.y}px))`,
            }}
          />
        </div>
      </div>

      <div className="absolute bottom-[max(1.4rem,env(safe-area-inset-bottom))] right-4 z-10 flex flex-col items-end gap-2">
        {hud.weps.some((w) => w.id === "domain") && (
          <SkillButton
            label={ch.domainName.slice(0, 2)}
            ready={hud.domainReady}
            cd={hud.domainCd}
            max={hud.domainMax}
            accent={ice ? "ice" : "blood"}
            onClick={() => {
              unlockAudio();
              simRef.current.wantDomain = true;
            }}
          />
        )}
        {hud.weps.some((w) => w.id === "purple") && (
          <SkillButton
            label="虚式"
            ready={hud.purpleReady}
            cd={hud.purpleCd}
            max={hud.purpleMax}
            accent="ice"
            onClick={() => {
              unlockAudio();
              simRef.current.wantPurple = true;
            }}
          />
        )}
        <SkillButton
          label={hud.dashReady ? ch.dashName : `${Math.ceil(hud.dashCd)}`}
          ready={hud.dashReady}
          cd={hud.dashCd}
          max={hud.dashMax}
          accent="paper"
          onClick={() => {
            unlockAudio();
            simRef.current.wantDash = true;
          }}
        />
      </div>

      <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 hidden -translate-x-1/2 text-xs text-mute md:block">
        WASD 走 · Shift {ch.dashName} · E 虚式 · 空格术域 · Esc 暂停
      </p>

      {hud.picks && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-ink/70 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:items-center">
          <div className="w-full max-w-lg">
            <p className="mb-1 font-display text-xl text-paper">升级 · 选一条术式</p>
            <p className="mb-3 text-xs text-mute">秽物会等。选完再割。</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {hud.picks.map((p) => {
                const cur = simRef.current.weps[p.id] ?? 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      unlockAudio();
                      simRef.current.choose(p.id as UpgradeId);
                      setHud(simRef.current.hud());
                    }}
                    className="rounded-lg border border-line bg-ink-2 p-4 text-left"
                  >
                    <p className="text-sm text-paper">{p.name}</p>
                    <p className="mt-1 text-xs tracking-[0.18em] text-ice">{p.kana}</p>
                    <p className="mt-2 text-xs leading-relaxed text-mute">{p.desc(cur + 1)}</p>
                    <p className="mt-3 text-xs text-mute">
                      Lv. {cur} → {cur + 1}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {hud.userPaused && !hud.over && !hud.picks && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/80 p-5">
          <div className="w-full max-w-sm rounded-xl border border-line bg-ink-2 p-6">
            <p className="font-display text-2xl text-paper">暂停</p>
            <p className="mt-2 text-sm text-mute">秽物不会等你。但这一秒可以。</p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  unlockAudio();
                  simRef.current.togglePause();
                  setHud(simRef.current.hud());
                }}
                className="h-12 rounded-lg bg-paper text-sm font-medium text-ink"
              >
                继续
              </button>
              <button
                type="button"
                onClick={onExit}
                className="h-12 rounded-lg border border-line text-sm text-paper"
              >
                返回选人
              </button>
            </div>
          </div>
        </div>
      )}

      {hud.over && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/80 p-5">
          <div className="w-full max-w-sm rounded-xl border border-line bg-ink-2 p-6">
            <p className="font-display text-2xl text-paper">{hud.won ? "还站着。" : "领域收束"}</p>
            <p className="mt-2 text-sm text-mute">
              {hud.won ? "三分钟。秽物没把你按回去。" : "……就这？不，再来。"}
            </p>
            <p className="mt-3 text-sm tabular-nums text-paper">
              {formatClock(hud.time)} · 祓除 {hud.kills} · 第 {hud.wave} 波 · Lv. {hud.level}
            </p>
            {unlocks.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-ice">
                {unlocks.map((u) => (
                  <li key={u}>+ {u}</li>
                ))}
              </ul>
            )}
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={retry}
                className="h-12 rounded-lg bg-paper text-sm font-medium text-ink"
              >
                再来一次
              </button>
              <button
                type="button"
                onClick={onExit}
                className="h-12 rounded-lg border border-line text-sm text-paper"
              >
                返回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getX: () => number;
      setKeys: (codes: string[]) => void;
      setSteer?: (v: number) => void;
    };
    __hordeTest?: {
      offer: () => HudSnap;
      finish: (won: boolean) => HudSnap;
      choose: (id: string) => HudSnap;
      hud: () => HudSnap;
    };
  }
}
