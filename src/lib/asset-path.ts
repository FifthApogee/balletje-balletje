// GitHub Pages serves this project from /balletje-balletje/, not from the
// domain root, so every hardcoded "/background/..." or "/audios/..." path
// needs that prefix in production. next.config.ts sets basePath the same
// way and exposes it here via NEXT_PUBLIC_BASE_PATH so both stay in sync.
// Locally (and in any other host that serves from root) the env var is
// unset and this is a no-op.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function assetPath(path: string): string {
  return `${BASE_PATH}${path}`;
}
