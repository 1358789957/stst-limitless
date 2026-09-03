import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GameRoot } from "@/components/game/GameRoot";
import "../src/styles.css";

const el = document.getElementById("app");
if (!el) throw new Error("missing #app");

createRoot(el).render(
  <StrictMode>
    <GameRoot />
  </StrictMode>,
);
