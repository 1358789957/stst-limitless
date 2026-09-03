import { useEffect, useState } from "react";
import { HordeGame } from "@/components/game/HordeGame";
import { StartScreen } from "@/components/game/StartScreen";
import { resumeAudio, setMuted } from "@/lib/game/audio";
import { type CharId } from "@/lib/game/characters";
import { isCharUnlocked, loadMeta, type Meta } from "@/lib/game/meta";

export function GameRoot() {
  const [phase, setPhase] = useState<"menu" | "play">("menu");
  const [meta, setMeta] = useState<Meta>(() => loadMeta());
  const [charId, setCharId] = useState<CharId>("gojo");

  useEffect(() => {
    const m = loadMeta();
    setMeta(m);
    setMuted(m.muted);
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "hidden") resumeAudio();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (phase !== "play") {
    return (
      <StartScreen
        meta={meta}
        selected={charId}
        onSelect={setCharId}
        onMute={(muted) => setMeta((m) => ({ ...m, muted }))}
        onStart={(id) => {
          const latest = loadMeta();
          if (!isCharUnlocked(id, latest)) return;
          setCharId(id);
          setPhase("play");
        }}
      />
    );
  }

  return (
    <HordeGame
      key={charId}
      charId={charId}
      extraStart={meta.extraStart}
      onExit={() => {
        setMeta(loadMeta());
        setPhase("menu");
      }}
    />
  );
}
