import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = resolve(import.meta.dirname, "static");

/** Client-only SPA for deepdemos / any static host. Does not touch `npm run dev`. */
export default defineConfig({
  root,
  base: "./",
  publicDir: false,
  plugins: [tailwindcss(), viteReact()],
  resolve: {
    alias: { "@": resolve(import.meta.dirname, "src") },
  },
  build: {
    outDir: resolve(import.meta.dirname, "dist-static"),
    emptyOutDir: true,
    assetsDir: "assets",
    cssCodeSplit: false,
  },
});
