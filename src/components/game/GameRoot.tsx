import { useEffect, useState } from "react";
import { HordeGame } from "@/components/game/HordeGame";
import { StartScreen } from "@/components/game/StartScreen";
import { resumeAudio, setMuted } from "@/lib/game/audio";
import type { CharId } from "@/lib/game/characters";
import { loadMeta, type Meta } from "@/lib/game/meta";

export function GameRoot() {
  const [phase, setPhase] = useState<"boot" | "menu" | "play">("boot");
  const [meta, setMeta] = useState<Meta>(() => loadMeta());
  const [charId, setCharId] = useState<CharId>("gojo");

  useEffect(() => {
    const m = loadMeta();
    setMeta(m);
    setMuted(m.muted);
    setPhase("menu");
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
        booting={phase === "boot"}
        meta={meta}
        selected={charId}
        onSelect={setCharId}
        onStart={(id) => {
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
      onExit={() => {
        setMeta(loadMeta());
        setPhase("menu");
      }}
    />
  );
}
