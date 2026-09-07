# UMESH SMARTBILL — prototype (Phase P0 demo)

Vite + React, offline-first (localStorage), full GST tax engine with golden tests.

```bash
npm install
npm run check     # 11 tax golden tests + SSR smoke render (must be green before any change ships)
npm run dev       # dev server :5173 (HMR)
npm start         # production build + static preview on :5173  ← what the Arena preview serves
```

## Architecture rules (learned the hard way)
1. **No React-hook state at module top-level before effects use it** — App-level `const s = useApp()` must be declared FIRST, before any `useEffect` that references `s` in its deps (TDZ crash: "Cannot access 's' before initialization", fixed 2026-09-07).
2. `useSyncExternalStore` gets `getServerSnapshot` (= getState) so SSR/smoke works.
3. Pages import shared bindings from `src/lib/*` + `App.jsx` exports — keep the graph acyclic; if a new shared module is needed, create `src/state.mjs` rather than deepening the App↔pages cycle.
4. The preview panel serves `dist/` via `vite preview` with `Cache-Control: no-store` — after every code change run `npm run build` and restart `npm start`.
5. No external URLs at boot (fonts are system-stack) — sandbox iframes stall on render-blocking requests.
