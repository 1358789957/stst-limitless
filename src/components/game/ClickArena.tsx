import { useEffect, useRef, useState } from "react";
import { SPIRITS } from "@/lib/game/content";
import { formatCE } from "@/lib/game/format";
import { isBossWave } from "@/lib/game/formulas";
import { onGameEvent } from "@/lib/game/events";
import { unlockAudio } from "@/lib/game/audio";
import { useGame } from "@/lib/game/store";
import { cn } from "@/lib/utils";

type Floater = {
  id: number;
  x: number;
  y: number;
  text: string;
  crit: boolean;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  r: number;
  ice: boolean;
};

let fid = 1;

export function ClickArena() {
  const rootRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const trauma = useRef(0);
  const [floats, setFloats] = useState<Floater[]>([]);
  const [veil, setVeil] = useState(0);
  const [flash, setFlash] = useState<{ n: number; id: string } | null>(null);

  const click = useGame((s) => s.click);
  const combo = useGame((s) => s.combo);
  const derived = useGame((s) => s.derived);
  const spiritHp = useGame((s) => s.spiritHp);
  const spiritMax = useGame((s) => s.spiritMax);
  const spiritId = useGame((s) => s.spiritId);
  const wave = useGame((s) => s.wave);
  const clicks = useGame((s) => s.clicks);
  const domainActive = derived.domainActive;

  const spirit = SPIRITS.find((s) => s.id === spiritId) ?? SPIRITS[0]!;
  const hpPct = Math.max(0, Math.min(1, spiritHp / Math.max(1, spiritMax)));
  const boss = isBossWave(wave);

  useEffect(() => {
    return onGameEvent((e) => {
      if (e.type === "click") {
        trauma.current = Math.min(1, trauma.current + (e.crit ? 0.62 : 0.22));
        const id = fid++;
        setFloats((fs) =>
          [
            ...fs.slice(-14),
            {
              id,
              x: e.x * 100,
              y: e.y * 100,
              text: e.crit ? `黑闪 ${formatCE(e.amount)}` : `+${formatCE(e.amount)}`,
              crit: e.crit,
            },
          ],
        );
        window.setTimeout(() => {
          setFloats((fs) => fs.filter((f) => f.id !== id));
        }, 760);
        spawn(e.x, e.y, e.crit);
      }
      if (e.type === "domain") {
        setVeil((v) => v + 1);
        trauma.current = 1;
      }
      if (e.type === "skill") {
        setFlash({ n: fid++, id: e.id });
        trauma.current = Math.min(1, trauma.current + (e.id === "purple" ? 0.9 : 0.5));
        spawn(0.62, 0.48, e.id === "purple");
      }
    });
  }, []);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = cvs.clientWidth;
      const h = cvs.clientHeight;
      if (cvs.width !== Math.floor(w * dpr) || cvs.height !== Math.floor(h * dpr)) {
        cvs.width = Math.floor(w * dpr);
        cvs.height = Math.floor(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      trauma.current = Math.max(0, trauma.current - dt * 2.4);
      const shake = trauma.current * trauma.current;
      if (rootRef.current && !reduce) {
        if (shake < 0.002) {
          rootRef.current.style.transform = "";
        } else {
          const ox = (Math.random() * 2 - 1) * shake * 10;
          const oy = (Math.random() * 2 - 1) * shake * 8;
          rootRef.current.style.transform = `translate(${ox}px, ${oy}px)`;
        }
      }
      const next: Particle[] = [];
      for (const p of particles.current) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 40 * dt;
        if (p.life <= 0) continue;
        const a = p.life / p.max;
        ctx.beginPath();
        ctx.fillStyle = p.ice
          ? `rgba(126,232,228,${0.85 * a})`
          : `rgba(12,12,16,${0.7 * a})`;
        ctx.arc(p.x * w, p.y * h, p.r * a, 0, Math.PI * 2);
        ctx.fill();
        next.push(p);
      }
      particles.current = next;
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  function spawn(x: number, y: number, crit: boolean) {
    const n = crit ? 18 : 8;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.35 + Math.random() * 0.7;
      particles.current.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 0.35,
        life: 0.35 + Math.random() * 0.3,
        max: 0.55,
        r: crit ? 3.2 : 2.1,
        ice: !crit || Math.random() > 0.35,
      });
    }
  }

  return (
    <button
      ref={rootRef}
      type="button"
      aria-label="引导咒力"
      onPointerDown={(e) => {
        if (e.button !== 0 && e.pointerType === "mouse") return;
        unlockAudio();
        const el = rootRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width;
        const ny = (e.clientY - r.top) / r.height;
        click(nx, ny);
      }}
      className="relative isolate min-h-[240px] flex-1 overflow-hidden select-none touch-manipulation"
    >
      <img src="/art/bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#08080c55_0%,transparent_30%,#08080c88_100%)]" />

      <img
        src={domainActive ? "/art/hero-eyes.png" : "/art/hero.png"}
        alt=""
        className="pointer-events-none absolute bottom-[-6%] left-[-8%] h-[108%] max-w-none object-contain object-bottom mix-blend-lighten sm:left-[4%]"
      />
      <img
        src={spirit.art}
        alt=""
        className="pointer-events-none absolute right-[-6%] bottom-[-4%] h-[72%] max-w-none object-contain object-bottom mix-blend-lighten opacity-90 sm:right-[8%]"
      />
      <img
        src="/art/orb.png"
        alt=""
        className={cn(
          "pointer-events-none absolute left-1/2 top-[42%] h-[28%] -translate-x-1/2 -translate-y-1/2 object-contain mix-blend-screen opacity-80",
          combo > 8 && "opacity-100",
        )}
      />

      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />

      {veil > 0 && (
        <div
          key={veil}
          className="domain-veil pointer-events-none absolute inset-0 bg-[radial-gradient(circle,transparent_20%,#08080cf2_100%)]"
        />
      )}
      {flash && (
        <div
          key={flash.n}
          className={cn(
            "domain-veil pointer-events-none absolute inset-0",
            flash.id === "blue" &&
              "bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-ice)_35%,transparent),transparent_55%)]",
            flash.id === "red" &&
              "bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-blood)_40%,transparent),transparent_58%)]",
            flash.id === "purple" &&
              "bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-paper)_18%,transparent)_18%,#08080cf0_100%)]",
          )}
        />
      )}

      {floats.map((f) => (
        <span
          key={f.id}
          className={cn(
            "float-ce pointer-events-none absolute z-10 whitespace-nowrap font-mono text-sm tabular-nums",
            f.crit ? "text-paper" : "text-ice",
          )}
          style={{ left: `${f.x}%`, top: `${f.y}%` }}
        >
          {f.text}
        </span>
      ))}

      <div className="pointer-events-none absolute inset-x-4 bottom-3 sm:inset-x-6">
        {clicks === 0 && (
          <p className="mb-3 text-center text-xs tracking-[0.22em] text-ice">点按画面，引导咒力</p>
        )}
        <div className="mb-1 flex items-end justify-between gap-3 text-xs tracking-wide">
          <span className="text-paper">
            {boss ? "遭遇 · " : ""}
            {spirit.grade} · {spirit.name}
            <span className="ml-2 text-mute">第 {wave + 1} 波</span>
          </span>
          <span className="font-mono tabular-nums text-mute">
            {formatCE(spiritHp)} / {formatCE(spiritMax)}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ink-3">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-150",
              boss ? "bg-blood" : "bg-ice",
            )}
            style={{ width: `${hpPct * 100}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-mute">{spirit.flavor}</p>
      </div>
    </button>
  );
}
