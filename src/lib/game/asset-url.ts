/** Resolve a file under `public/` for both the Start app (`/`) and the static zip (`./`). */
export function publicUrl(path: string): string {
  const clean = path.replace(/^\/+/, "");
  const raw = import.meta.env?.BASE_URL || "/";
  const base = raw.endsWith("/") ? raw : `${raw}/`;
  return `${base}${clean}`;
}
