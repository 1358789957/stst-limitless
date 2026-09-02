import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { loadAtlas } from "@/lib/game/atlas";
import { resumeAudio, setMuted, unlockAudio } from "@/lib/game/audio";
import { CHAR_MAP, type CharId } from "@/lib/game/characters";
import { formatClock } from "@/lib/game/format";
import { HordeSim, type DmgKind, type HudSnap } from "@/lib/game/horde";
import { loadMeta, recordRun, setMutedMeta } from "@/lib/game/meta";
import { UPGRADE_MAP, type UpgradeId } from "@/lib/game/upgrades";
import { cn } from "@/lib/utils";

function wepChip(id: UpgradeId, lv: number) {
  if (id === "limitless") return `无下限被动`;
  if (id === "fist") return `拳脚`;
  if (id === "blue") return `苍`;
  if (id === "cleave") return `捌被动`;
  if (id === "slash") return `解主动`;
  if (id === "power") return `伤害砧 ${lv}`;
  if (id === "rate") return `频率砧 ${lv}`;
  if (id === "infCap") return `无下限容量 ${lv}`;
  if (id === "infRad") return `无下限半径 ${lv}`;
  return `${UPGRADE_MAP[id]?.name ?? id} ${lv}`;
}

function TwinStick({
  side,
  accent,
  onVec,
}: {
  side: "left" | "right";
  accent: "ice" | "blood";
  onVec: (x: number, y: number) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const pid = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const ring = accent === "blood" ? "border-blood/50" : "border-ice/50";
  const apply = (cx: number, cy: number) => {
    const el = box.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = cx - (r.left + r.width / 2);
    const dy = cy - (r.top + r.height / 2);
    const m = Math.hypot(dx, dy) || 1;
    const cap = r.width * 0.42;
    const t = Math.min(1, m / cap);
    const nx = (dx / m) * t;
    const ny = (dy / m) * t;
    setKnob({ x: nx, y: ny });
    onVec(nx, ny);
  };
  return (
    <div
      ref={box}
      className={cn(
        "pointer-events-auto absolute bottom-[max(1.2rem,env(safe-area-inset-bottom))] z-20 size-28 rounded-full border-2 bg-ink/35 md:hidden",
        ring,
        side === "left" ? "left-4" : "right-4",
      )}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        pid.current = e.pointerId;
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        unlockAudio();
        apply(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (pid.current !== e.pointerId) return;
        apply(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (pid.current !== e.pointerId) return;
        pid.current = null;
        setKnob({ x: 0, y: 0 });
        onVec(0, 0);
      }}
      onPointerCancel={() => {
        pid.current = null;
        setKnob({ x: 0, y: 0 });
        onVec(0, 0);
      }}
    >
      <div
        className="absolute left-1/2 top-1/2 size-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper/80"
        style={{ transform: `translate(calc(-50% + ${knob.x * 36}px), calc(-50% + ${knob.y * 36}px))` }}
      />
    </div>
  );
}

function SkillButton({
  slotKey,
  label,
  ready,
  unlocked,
  cd,
  max,
  rank,
  onClick,
  accent,
}: {
  slotKey: string;
  label: string;
  ready: boolean;
  unlocked: boolean;
  cd: number;
  max: number;
  rank: number;
  onClick: () => void;
  accent: "ice" | "blood" | "paper";
}) {
  const t = !unlocked ? 0 : max > 0 ? Math.max(0, Math.min(1, 1 - cd / max)) : 1;
  const ring =
    accent === "blood" ? "#c44c4c" : accent === "ice" ? "#7ee8e4" : "#efe8d8";
  return (
    <button
      type="button"
      disabled={!ready}
      onClick={onClick}
      className={cn(
        "relative h-14 min-w-[3.6rem] overflow-hidden rounded-full border px-3 text-sm font-medium",
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
      <span className="relative z-10 flex flex-col items-center leading-none">
        <span className="text-[10px] tracking-wider text-mute">
          {slotKey}
          {unlocked && rank > 0 ? `·${rank}` : ""}
        </span>
        <span className="mt-0.5">{!unlocked ? "—" : ready ? label : Math.ceil(cd)}</span>
      </span>
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
  const movePtr = useRef<number | null>(null);
  const firePtr = useRef<number | null>(null);
  const [hud, setHud] = useState<HudSnap>(() => simRef.current.hud());
  const [ready, setReady] = useState(false);
  const [muted, setMutedState] = useState(() => loadMeta().muted);
  const [unlocks, setUnlocks] = useState<string[]>([]);
  const [touchUi, setTouchUi] = useState(false);

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
    const mq = window.matchMedia("(pointer: coarse)");
    const sync = () => setTouchUi(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

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
      if (e.code === "Space") {
        e.preventDefault();
        return;
      }
      if (e.code === "KeyQ") sim.wantDash = true;
      if (e.code === "KeyW") sim.wantSecondary = true;
      if (e.code === "KeyE") sim.wantBurst = true;
      if (e.code === "KeyR" && !sim.over) sim.wantDomain = true;
      if (e.code === "KeyQ" || e.code === "KeyW" || e.code === "KeyE" || e.code === "KeyR") {
        e.preventDefault();
      }
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
        sim.setMoveTarget(sim.x - v * 180, sim.y);
      },
      setMoveTarget: (x: number, y: number) => sim.setMoveTarget(x, y),
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
      setMoveTarget: (x: number, y: number) => sim.setMoveTarget(x, y),
      grant: (id: string, n: number) => {
        sim.weps[id as UpgradeId] = n;
        sim.applyStats();
        return sim.hud();
      },
      setAimWorld: (x: number, y: number) => sim.setAimWorld(x, y),
      fire: (on: boolean) => {
        sim.wantFire = on;
      },
      hurt: (kind: string, dmg: number) => sim.hurtPlayer(dmg, kind as DmgKind),
      birth: (kind: number, elite?: boolean) => sim.birth(kind as 0 | 1 | 2 | 3, { elite, near: true }),
      place: (kind: number, dx = 8, dy = 0, elite?: boolean) => {
        sim.birth(kind as 0 | 1 | 2 | 3, { elite, near: true });
        const e = sim.enemies.filter((x) => x.alive).at(-1);
        if (e) {
          e.x = sim.x + dx;
          e.y = sim.y + dy;
        }
      },
      step: (n = 1) => {
        for (let i = 0; i < n; i++) sim.tick(1 / 60);
      },
      debug: () => ({
        lasers: sim.lasers.filter((l) => l.alive).length,
        chains: sim.chains.length,
        fields: sim.fields.filter((f) => f.alive).length,
        flashHops: sim.chains.filter((c) => c.kind === 0).length,
        bf: { window: sim.bfWindow, buff: sim.bfBuff, hits: sim.bfHits },
        shell: { r: sim.shellRadius(), load: sim.shellLoad, cap: sim.shellCap, leak: sim.shellLeak, press: sim.shellPress },
        adapt: { fill: sim.adaptFill, on: sim.adaptOn, turns: sim.adaptTurns, focus: sim.adaptFocus },
        lastHurt: sim.lastHurt,
        hp: sim.hp,
        blues: sim.bullets.filter((b) => b.alive && b.kind === 0).length,
        reds: sim.bullets.filter((b) => b.alive && b.kind === 1).length,
        slashes: sim.bullets.filter((b) => b.alive && b.kind === 4).length,
        punches: sim.punchHits,
      }),
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

  function worldFromClient(clientX: number, clientY: number) {
    const cvs = canvasRef.current;
    if (!cvs) return null;
    const rect = cvs.getBoundingClientRect();
    return { sx: clientX - rect.left, sy: clientY - rect.top, w: rect.width, h: rect.height };
  }

  function moveAt(clientX: number, clientY: number) {
    const p = worldFromClient(clientX, clientY);
    if (!p) return;
    simRef.current.setMoveFromScreen(p.sx, p.sy, p.w, p.h);
  }

  function fireAt(clientX: number, clientY: number) {
    const p = worldFromClient(clientX, clientY);
    if (!p) return;
    simRef.current.setAimFromScreen(p.sx, p.sy, p.w, p.h);
    simRef.current.wantFire = true;
  }

  const ch = CHAR_MAP[hud.charId];
  const ice = ch.accent === "ice";
  const blocking = Boolean(hud.picks || hud.userPaused || hud.over);

  return (
    <div className="relative h-dvh overflow-hidden bg-ink text-paper" onContextMenu={(e) => e.preventDefault()}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          if (blocking || touchUi) return;
          const fire = e.pointerType === "mouse" && e.button === 0;
          const move = e.pointerType !== "mouse" || e.button === 2;
          if (!fire && !move) return;
          e.preventDefault();
          unlockAudio();
          (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
          if (fire) {
            firePtr.current = e.pointerId;
            fireAt(e.clientX, e.clientY);
          } else {
            movePtr.current = e.pointerId;
            moveAt(e.clientX, e.clientY);
          }
        }}
        onPointerMove={(e) => {
          if (firePtr.current === e.pointerId) fireAt(e.clientX, e.clientY);
          if (movePtr.current === e.pointerId) moveAt(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          if (firePtr.current === e.pointerId) {
            firePtr.current = null;
            simRef.current.wantFire = false;
          }
          if (movePtr.current === e.pointerId) movePtr.current = null;
        }}
        onPointerCancel={() => {
          firePtr.current = null;
          movePtr.current = null;
          simRef.current.wantFire = false;
        }}
      />

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
            <p className="mt-0.5 text-[10px] text-mute">
              {ice ? "无下限被动 · 左键拳脚" : "捌被动 · 左键解"}
            </p>
            {ice && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] text-mute">无下限</span>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-3">
                  <div
                    className={cn("h-full rounded-full", hud.shellLeak ? "bg-blood" : "bg-ice")}
                    style={{ width: `${Math.max(0, Math.min(100, hud.shell * 100))}%` }}
                  />
                </div>
                {hud.shellLeak && <span className="text-[10px] text-blood">漏</span>}
              </div>
            )}
            {hud.adapt && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] text-mute">轮</span>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-3">
                  <div
                    className="h-full rounded-full bg-blood"
                    style={{ width: `${Math.max(0, Math.min(100, (hud.adapt.fill / Math.max(1, hud.adapt.need)) * 100))}%` }}
                  />
                </div>
                <span className="text-[10px] text-mute">
                  {hud.adapt.on ?? hud.adapt.focus ?? "—"} · {hud.adapt.turns}
                </span>
              </div>
            )}
            {(hud.bfWindow > 0 || hud.bfBuff > 0) && (
              <p className="text-[10px] text-paper">{hud.bfBuff > 0 ? "黑闪" : "对上了"}</p>
            )}
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
        {hud.weps.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {hud.weps.map((w) => (
              <span key={w.id} className="rounded-sm bg-ink-2/90 px-2 py-0.5 text-[11px] text-mute">
                {wepChip(w.id, w.lv)}
              </span>
            ))}
          </div>
        )}
      </header>

      {touchUi && (
        <>
          <TwinStick side="left" accent={ice ? "ice" : "blood"} onVec={(x, y) => simRef.current.setMoveStick(x, y)} />
          <TwinStick side="right" accent={ice ? "ice" : "blood"} onVec={(x, y) => simRef.current.setFireStick(x, y)} />
        </>
      )}

      <div className={cn("absolute right-4 z-10 flex flex-col items-end gap-2", touchUi ? "bottom-[max(10.5rem,calc(env(safe-area-inset-bottom)+9rem))]" : "bottom-[max(1.4rem,env(safe-area-inset-bottom))]")}>
        {hud.skills
          .slice()
          .reverse()
          .map((s) => (
            <SkillButton
              key={s.key}
              slotKey={s.key}
              label={s.name}
              ready={s.ready}
              unlocked={s.unlocked}
              cd={s.cd}
              max={s.max}
              rank={s.rank}
              accent={s.key === "Q" ? "paper" : ice ? "ice" : "blood"}
              onClick={() => {
                unlockAudio();
                if (s.key === "Q") simRef.current.wantDash = true;
                if (s.key === "W") simRef.current.wantSecondary = true;
                if (s.key === "E") simRef.current.wantBurst = true;
                if (s.key === "R") simRef.current.wantDomain = true;
              }}
            />
          ))}
      </div>

      <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 hidden -translate-x-1/2 text-xs text-mute md:block">
        右键走 · 按住左键{ice ? "拳脚" : "解"} · Q {ch.dashName} · W {ice ? "六赫" : "捌"} · E {ice ? "虚式" : "开"} · R 术域 · Esc 暂停
      </p>

      {hud.picks && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-ink/70 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:items-center">
          <div className="w-full max-w-lg">
            <p className="mb-1 font-display text-xl text-paper">
              {hud.forgeChain ? "锻造器 · 连抽" : "锻造器"}
            </p>
            <p className="mb-3 text-xs text-mute">
              等级只加血。专属入砧有机会再锻。质变收口。
              {hud.anvilChain > 0 ? ` 已连抽 ${hud.anvilChain}/3。` : ""}
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {hud.picks.map((p) => {
                return (
                  <button
                    key={`${p.tag}-${p.id}`}
                    type="button"
                    onClick={() => {
                      unlockAudio();
                      simRef.current.choose(p.id as UpgradeId);
                      setHud(simRef.current.hud());
                    }}
                    className="rounded-lg border border-line bg-ink-2 p-4 text-left"
                  >
                    <p className="text-[10px] tracking-[0.2em] text-ice">{p.tag}</p>
                    <p className="mt-1 text-sm text-paper">{p.name}</p>
                    <p className="mt-1 text-xs tracking-[0.18em] text-ice">{p.kana}</p>
                    <p className="mt-2 text-xs leading-relaxed text-mute">{p.desc}</p>
                    <p className="mt-3 text-xs text-mute">
                      {p.tag === "质变" ? "质变 · 选完收口" : p.tag === "专属" ? "专属 · 有机会连抽" : p.tag}
                      {" · "}
                      {p.from} → {p.to}
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
            <p className="mt-1 text-xs text-mute">右键走。按住左键打。QWER 术式。</p>
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
      setMoveTarget?: (x: number, y: number) => void;
    };
    __hordeTest?: {
      offer: () => HudSnap;
      finish: (won: boolean) => HudSnap;
      choose: (id: string) => HudSnap;
      hud: () => HudSnap;
      setMoveTarget: (x: number, y: number) => void;
      grant: (id: string, n: number) => HudSnap;
      setAimWorld?: (x: number, y: number) => void;
      fire?: (on: boolean) => void;
      hurt?: (kind: string, dmg: number) => void;
      birth?: (kind: number, elite?: boolean) => void;
      place?: (kind: number, dx?: number, dy?: number, elite?: boolean) => void;
      step?: (n?: number) => void;
      debug: () => {
        lasers: number;
        chains: number;
        fields: number;
        flashHops?: number;
        bf?: { window: number; buff: number; hits: number };
        shell?: { r: number; load: number; cap: number; leak: boolean; press: number };
        adapt?: { fill: number; on: string | null; turns: number; focus: string | null };
        lastHurt?: string | null;
        hp?: number;
        blues?: number;
        reds?: number;
        slashes?: number;
        punches?: number;
      };
    };
  }
}
