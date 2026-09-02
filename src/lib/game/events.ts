export type GameEvent =
  | { type: "click"; x: number; y: number; amount: number; crit: boolean }
  | { type: "kill"; name: string; reward: number; boss?: boolean }
  | { type: "rank"; name: string }
  | { type: "achieve"; name: string }
  | { type: "toast"; text: string }
  | { type: "domain" }
  | { type: "skill"; id: "blue" | "red" | "purple" }
  | { type: "prestige"; gained: number };

type Handler = (e: GameEvent) => void;
const handlers = new Set<Handler>();

export function onGameEvent(h: Handler) {
  handlers.add(h);
  return () => {
    handlers.delete(h);
  };
}

export function emit(e: GameEvent) {
  for (const h of handlers) h(e);
}
