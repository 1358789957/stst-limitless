import { DOMAIN_COOLDOWN, SKILL_CD } from "@/lib/game/content";
import { formatTime } from "@/lib/game/format";
import { unlockAudio } from "@/lib/game/audio";
import { useGame } from "@/lib/game/store";
import type { SkillId } from "@/lib/game/types";
import { cn } from "@/lib/utils";

const SKILLS: { id: SkillId | "domain"; label: string }[] = [
  { id: "blue", label: "苍" },
  { id: "red", label: "赫" },
  { id: "purple", label: "虚式" },
  { id: "domain", label: "展开" },
];

export function SkillBar() {
  const tech = useGame((s) => s.tech);
  const skillCd = useGame((s) => s.skillCd);
  const domainUntil = useGame((s) => s.domainUntil);
  const domainCdUntil = useGame((s) => s.domainCdUntil);
  const energy = useGame((s) => s.energy);
  const castSkill = useGame((s) => s.castSkill);
  const activateDomain = useGame((s) => s.activateDomain);
  void energy;

  const now = Date.now();
  const visible = SKILLS.filter((s) => (tech[s.id] ?? 0) >= 1);
  if (visible.length === 0) return null;

  return (
    <div className="flex shrink-0 gap-2 border-t border-line bg-ink-2 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:pb-2">
      {visible.map((s) => {
        const readyAt =
          s.id === "domain" ? domainCdUntil : (skillCd[s.id] ?? 0);
        const left = readyAt - now;
        const domainOn = s.id === "domain" && now < domainUntil;
        const ready = left <= 0 && !domainOn;
        return (
          <button
            key={s.id}
            type="button"
            disabled={!ready}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              unlockAudio();
              if (s.id === "domain") activateDomain();
              else castSkill(s.id);
            }}
            className={cn(
              "h-11 min-h-11 flex-1 rounded-md border border-line text-sm tracking-wide",
              ready ? "bg-paper text-ink" : "bg-ink text-mute",
            )}
          >
            {domainOn
              ? "域内"
              : ready
                ? s.label
                : `${s.label} ${formatTime(left || (s.id === "domain" ? DOMAIN_COOLDOWN : SKILL_CD[s.id]))}`}
          </button>
        );
      })}
    </div>
  );
}
