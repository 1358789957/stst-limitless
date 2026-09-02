import { useState } from "react";
import {
  ACHIEVEMENTS,
  FAMILIARS,
  NOTES,
  PRESTIGE_AT,
  RANKS,
  TECHNIQUES,
} from "@/lib/game/content";
import { formatCE } from "@/lib/game/format";
import { familiarCost, isUnlocked, prestigeGain, techCost } from "@/lib/game/formulas";
import { exportSave, importSave } from "@/lib/game/save";
import { unlockAudio } from "@/lib/game/audio";
import { useGame } from "@/lib/game/store";
import type { TabId } from "@/lib/game/types";
import { cn } from "@/lib/utils";

const TABS: { id: TabId; label: string }[] = [
  { id: "arts", label: "术式" },
  { id: "familiars", label: "式神" },
  { id: "awaken", label: "觉醒" },
  { id: "archive", label: "档案" },
];

export function ShopPanel() {
  const tab = useGame((s) => s.tab);
  const setTab = useGame((s) => s.setTab);

  return (
    <section className="flex min-h-0 flex-1 flex-col border-t border-line bg-ink-2 lg:w-96 lg:flex-none lg:border-l lg:border-t-0">
      <div className="flex shrink-0 gap-1 px-3 pt-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "h-10 flex-1 rounded-md text-sm transition-colors",
              tab === t.id ? "bg-ink-3 text-paper" : "text-mute hover:text-paper",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {tab === "arts" && <ArtsTab />}
        {tab === "familiars" && <FamiliarsTab />}
        {tab === "awaken" && <AwakenTab />}
        {tab === "archive" && <ArchiveTab />}
      </div>
    </section>
  );
}

function ArtsTab() {
  const lifetime = useGame((s) => s.lifetime);
  const energy = useGame((s) => s.energy);
  const tech = useGame((s) => s.tech);
  const costFactor = useGame((s) => s.derived.costFactor);
  const buyTech = useGame((s) => s.buyTech);

  return (
    <ul className="flex flex-col gap-2">
      {TECHNIQUES.map((t) => {
        const open = isUnlocked(t.unlockAt, lifetime);
        const lv = tech[t.id] ?? 0;
        const cost = techCost(t.id, lv, costFactor);
        const can = open && energy >= cost;
        return (
          <li
            key={t.id}
            className="rounded-lg border border-line bg-ink p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-paper">
                  {t.name}
                  <span className="ml-2 font-mono text-xs text-mute">
                    {open ? `Lv. ${lv}` : "未解"}
                  </span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-mute">
                  {open ? t.desc : `累计咒力 ${formatCE(t.unlockAt)} 解锁`}
                </p>
                {open && t.prod > 0 && (
                  <p className="mt-1 text-[11px] tabular-nums text-ice-dim">
                    +{formatCE(t.prod)}/秒 · 级
                  </p>
                )}
              </div>
              {open && (
                <div className="flex shrink-0 flex-col gap-1">
                  <BuyBtn
                    disabled={!can}
                    label={formatCE(cost)}
                    onClick={() => {
                      unlockAudio();
                      buyTech(t.id, false);
                    }}
                  />
                  <button
                    type="button"
                    disabled={energy < cost}
                    onClick={() => {
                      unlockAudio();
                      buyTech(t.id, true);
                    }}
                    className="h-8 rounded-sm px-2 text-[11px] text-mute disabled:opacity-30"
                  >
                    尽量买
                  </button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function FamiliarsTab() {
  const lifetime = useGame((s) => s.lifetime);
  const energy = useGame((s) => s.energy);
  const familiars = useGame((s) => s.familiars);
  const costFactor = useGame((s) => s.derived.costFactor);
  const buyFamiliar = useGame((s) => s.buyFamiliar);

  return (
    <ul className="flex flex-col gap-2">
      {FAMILIARS.map((t) => {
        const open = isUnlocked(t.unlockAt, lifetime);
        const lv = familiars[t.id] ?? 0;
        const cost = familiarCost(t.id, lv, costFactor);
        const can = open && energy >= cost;
        return (
          <li key={t.id} className="rounded-lg border border-line bg-ink p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-paper">
                  {t.name}
                  <span className="ml-2 font-mono text-xs text-mute">
                    {open ? `× ${lv}` : "未解"}
                  </span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-mute">
                  {open ? t.desc : `累计咒力 ${formatCE(t.unlockAt)} 解锁`}
                </p>
                {open && (
                  <p className="mt-1 text-[11px] tabular-nums text-ice-dim">
                    +{formatCE(t.prod)}/秒 · 只
                  </p>
                )}
              </div>
              {open && (
                <div className="flex shrink-0 flex-col gap-1">
                  <BuyBtn
                    disabled={!can}
                    label={formatCE(cost)}
                    onClick={() => {
                      unlockAudio();
                      buyFamiliar(t.id, false);
                    }}
                  />
                  <button
                    type="button"
                    disabled={energy < cost}
                    onClick={() => {
                      unlockAudio();
                      buyFamiliar(t.id, true);
                    }}
                    className="h-8 rounded-sm px-2 text-[11px] text-mute disabled:opacity-30"
                  >
                    尽量买
                  </button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function AwakenTab() {
  const lifetime = useGame((s) => s.lifetime);
  const prestige = useGame((s) => s.prestige);
  const ascended = useGame((s) => s.ascended);
  const prestigeNow = useGame((s) => s.prestigeNow);
  const gained = prestigeGain(lifetime);
  const ready = gained > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-line bg-ink p-4">
        <p className="font-display text-lg text-paper">再开 · 最强残核</p>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          把术式和咒力清零，只带走残核。每枚残核让全局产出 +14%。累计咒力达到{" "}
          {formatCE(PRESTIGE_AT)} 后可再开。
        </p>
        <p className="mt-3 font-mono text-sm tabular-nums text-ice">
          当前残核 {prestige} · 本次可获 {ready ? gained : 0}
        </p>
        <button
          type="button"
          disabled={!ready}
          onClick={() => {
            unlockAudio();
            prestigeNow();
          }}
          className="mt-4 h-11 w-full rounded-md bg-paper text-sm font-medium text-ink disabled:bg-ink-3 disabled:text-mute"
        >
          {ready ? `再开，获得 ${gained} 枚残核` : `还差 ${formatCE(Math.max(0, PRESTIGE_AT - lifetime))}`}
        </button>
      </div>
      <div>
        <p className="mb-2 text-xs tracking-[0.18em] text-mute">阶位</p>
        <ul className="flex flex-col gap-1.5">
          {RANKS.map((r) => {
            const on = ascended >= r.lifetime;
            return (
              <li
                key={r.id}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2 text-sm",
                  on ? "bg-ink text-paper" : "text-mute",
                )}
              >
                <span>{r.name}</span>
                <span className="font-mono text-[11px] tabular-nums">
                  {formatCE(r.lifetime)} · ×{r.mult.toFixed(2)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function ArchiveTab() {
  const achievements = useGame((s) => s.achievements);
  const clicks = useGame((s) => s.clicks);
  const kills = useGame((s) => s.kills);
  const blackFlashes = useGame((s) => s.blackFlashes);
  const bestCombo = useGame((s) => s.bestCombo);
  const wave = useGame((s) => s.wave);
  const rankId = useGame((s) => s.derived.rank.id);
  const hardReset = useGame((s) => s.hardReset);
  const applyImported = useGame((s) => s.applyImported);
  const [resetArmed, setResetArmed] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <Stat k="点按" v={formatCE(clicks)} />
        <Stat k="祓除" v={String(kills)} />
        <Stat k="黑闪" v={String(blackFlashes)} />
        <Stat k="最高连击" v={String(bestCombo)} />
        <Stat k="波次" v={String(wave + 1)} />
        <Stat k="成就" v={`${achievements.length}/${ACHIEVEMENTS.length}`} />
      </dl>
      <div>
        <p className="mb-2 text-xs tracking-[0.18em] text-mute">手记</p>
        <ul className="flex flex-col gap-1.5">
          {NOTES.map((n) => {
            const rank = RANKS.find((r) => r.id === n.rankId);
            const on = rank ? RANKS.findIndex((r) => r.id === rankId) >= RANKS.findIndex((r) => r.id === n.rankId) : false;
            return (
              <li
                key={n.id}
                className={cn(
                  "rounded-md border border-line px-3 py-2",
                  on ? "text-paper" : "text-mute",
                )}
              >
                <p className="text-sm">{on ? n.title : "？？"}</p>
                <p className="mt-1 text-xs leading-relaxed text-mute">
                  {on ? n.body : "阶位不足"}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
      <ul className="flex flex-col gap-1.5">
        {ACHIEVEMENTS.map((a) => {
          const on = achievements.includes(a.id);
          return (
            <li
              key={a.id}
              className={cn(
                "rounded-md border border-line px-3 py-2",
                on ? "text-paper" : "text-mute",
              )}
            >
              <p className="text-sm">{on ? a.name : "？？"}</p>
              <p className="text-xs text-mute">{on ? a.desc : "尚未达成"}</p>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            const blob = new Blob([exportSave(useGame.getState())], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "5t5-limitless.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="h-11 rounded-md border border-line text-sm text-paper"
        >
          导出存档
        </button>
        <label className="flex h-11 items-center justify-center rounded-md border border-line text-sm text-paper">
          导入存档
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              const text = await file.text();
              const s = importSave(text);
              if (!s) {
                setImportMsg("存档无法读取");
                return;
              }
              applyImported(s);
              setImportMsg("已写入");
            }}
          />
        </label>
        {importMsg && <p className="text-xs text-mute">{importMsg}</p>}
        <button
          type="button"
          onClick={() => {
            if (!resetArmed) {
              setResetArmed(true);
              return;
            }
            hardReset();
            setResetArmed(false);
          }}
          className="h-11 rounded-md text-sm text-blood"
        >
          {resetArmed ? "再点一次以清空" : "清空存档"}
        </button>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md bg-ink px-3 py-2">
      <dt className="text-[11px] text-mute">{k}</dt>
      <dd className="font-mono text-sm tabular-nums text-paper">{v}</dd>
    </div>
  );
}

function BuyBtn({
  disabled,
  label,
  onClick,
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="h-10 min-w-20 rounded-sm bg-paper px-3 text-xs font-medium tabular-nums text-ink disabled:bg-ink-3 disabled:text-mute"
    >
      {label}
    </button>
  );
}
