import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { loadAtlas } from "@/lib/game/atlas";
import { resumeAudio, setMuted, unlockAudio } from "@/lib/game/audio";
import { HordeSim, type HudSnap } from "@/lib/game/horde";
import { CHAR_MAP, type CharId } from "@/lib/game/characters";
import { loadMeta, recordRun, setMutedMeta } from "@/lib/game/meta";
import { UPGRADE_MAP, type UpgradeId } from "@/lib/game/upgrades";

function clock(t: number) {
  const s = Math.floor(t);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

export function HordeGame({ charId, onExit }: { charId: CharId; onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef(new HordeSim(charId));
  const stickId = useRef<number | null>(null);
  const [hud, setHud] = useState<HudSnap>(() => simRef.current.hud());
  const [ready, setReady] = useState(false);
  const [muted, setMutedState] = useState(() => loadMeta().muted);
  const [stick, setStick] = useState({ active: false, x: 0, y: 0 });

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
    return () => {
      if (window.__controlsTest === probe) delete window.__controlsTest;
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
          recordRun(snap.kills, snap.time);
        }
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "hidden") resumeAudio();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

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

  const origin = useRef({ x: 0, y: 0 });

  return (
    <div className="relative h-dvh overflow-hidden bg-ink text-paper">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
      />

      {!ready && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink text-sm text-mute">
          术式展开中…
        </div>
      )}

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-[max(0.7rem,env(safe-area-inset-top))]">
        <div className="flex items-start justify-between gap-3">
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
              {clock(hud.time)} · 祓除 {hud.kills} · 第 {hud.wave} 波 · Lv. {hud.level}
            </p>
            <p className="truncate text-xs text-ice">{hud.line}</p>
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
          </div>
        </div>
      </header>

      <div
        className="absolute bottom-0 left-0 z-10 h-52 w-1/2 touch-none sm:h-44"
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
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
        <div className="pointer-events-none absolute bottom-[max(1.4rem,env(safe-area-inset-bottom))] left-5 size-28 rounded-full border border-line bg-ink-2/70">
          <div
            className="absolute left-1/2 top-1/2 size-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper"
            style={{
              transform: `translate(calc(-50% + ${stick.x}px), calc(-50% + ${stick.y}px))`,
            }}
          />
        </div>
      </div>

      <div className="absolute bottom-[max(1.4rem,env(safe-area-inset-bottom))] right-4 z-10 flex flex-col items-end gap-2">
        {hud.weps
          .filter((w) => w.id !== "limitless" && w.id !== "slash")
          .slice(0, 3)
          .map((w) => (
            <span key={w.id} className="rounded-sm bg-ink-2 px-2 py-1 text-xs text-mute">
              {UPGRADE_MAP[w.id]?.name ?? w.id} {w.lv}
            </span>
          ))}
        <button
          type="button"
          disabled={!hud.dashReady}
          onClick={() => {
            unlockAudio();
            simRef.current.wantDash = true;
          }}
          className="h-14 min-w-14 rounded-full border border-line bg-paper px-4 text-sm font-medium text-ink disabled:bg-ink-2 disabled:text-mute"
        >
          {hud.dashReady ? CHAR_MAP[hud.charId].dashName : `${Math.ceil(hud.dashCd)}`}
        </button>
        {hud.weps.some((w) => w.id === "purple") && (
          <button
            type="button"
            disabled={!hud.purpleReady}
            onClick={() => {
              unlockAudio();
              simRef.current.wantPurple = true;
            }}
            className="h-14 min-w-14 rounded-full border border-line bg-paper px-4 text-sm font-medium text-ink disabled:bg-ink-2 disabled:text-mute"
          >
            {hud.purpleReady ? "虚式" : `${Math.ceil(hud.purpleCd)}`}
          </button>
        )}
        {hud.weps.some((w) => w.id === "domain") && (
          <button
            type="button"
            disabled={!hud.domainReady}
            onClick={() => {
              unlockAudio();
              simRef.current.wantDomain = true;
            }}
            className="h-14 min-w-14 rounded-full border border-line bg-paper px-4 text-sm font-medium text-ink disabled:bg-ink-2 disabled:text-mute"
          >
            {hud.domainReady ? CHAR_MAP[hud.charId].domainName.slice(0, 2) : `${Math.ceil(hud.domainCd)}`}
          </button>
        )}
      </div>

      <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 hidden -translate-x-1/2 text-xs text-mute sm:block">
        WASD 走 · Shift/{CHAR_MAP[hud.charId].dashName} · E 虚式 · 空格术域
      </p>

      {hud.picks && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-ink/70 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:items-center">
          <div className="w-full max-w-lg">
            <p className="mb-3 font-display text-xl text-paper">升级 · 选一条术式</p>
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
                    <p className="mt-2 text-xs leading-relaxed text-mute">
                      {p.desc(cur + 1)}
                    </p>
                    <p className="mt-3 text-xs text-mute">Lv. {cur} → {cur + 1}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {hud.over && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/80 p-5">
          <div className="w-full max-w-sm rounded-xl border border-line bg-ink-2 p-6">
            <p className="font-display text-2xl text-paper">领域收束</p>
            <p className="mt-2 text-sm text-mute">
              活了 {clock(hud.time)} · 祓除 {hud.kills} · 第 {hud.wave} 波
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  unlockAudio();
                  simRef.current.reset(charId);
                  setHud(simRef.current.hud());
                }}
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
  }
}
