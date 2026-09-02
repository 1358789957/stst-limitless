import { useEffect, useState } from "react";
import { onGameEvent } from "@/lib/game/events";
import { formatCE } from "@/lib/game/format";

type Toast = { id: number; text: string };

let tid = 1;

export function Toasts() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    return onGameEvent((e) => {
      let text = "";
      if (e.type === "kill")
        text = `${e.boss ? "遭遇解决" : "祓除"} ${e.name.replace("遭遇·", "")}  +${formatCE(e.reward)}`;
      if (e.type === "rank") text = `阶位 · ${e.name}`;
      if (e.type === "achieve") text = `成就 · ${e.name}`;
      if (e.type === "prestige") text = `再开 · 残核 +${e.gained}`;
      if (e.type === "toast") text = e.text;
      if (e.type === "domain") text = "术域展开";
      if (e.type === "skill") {
        text = e.id === "blue" ? "苍" : e.id === "red" ? "赫" : "虚式";
      }
      if (!text) return;
      const id = tid++;
      setItems((xs) => [...xs.slice(-4), { id, text }]);
      window.setTimeout(() => {
        setItems((xs) => xs.filter((x) => x.id !== id));
      }, 2200);
    });
  }, []);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[4.8rem] z-30 flex flex-col items-center gap-1 px-4">
      {items.map((t) => (
        <div
          key={t.id}
          className="rounded-md border border-line bg-ink-2/90 px-3 py-1.5 text-xs text-paper backdrop-blur-sm"
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
