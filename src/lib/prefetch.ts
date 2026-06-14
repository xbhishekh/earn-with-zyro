/**
 * Route prefetching utilities — preload chunks on hover/idle for instant nav.
 * Pro-scale UX: route changes feel zero-latency under heavy traffic.
 */

type Loader = () => Promise<unknown>;

const loaded = new Set<string>();
const inflight = new Map<string, Promise<unknown>>();

export const prefetch = (key: string, loader: Loader): Promise<unknown> => {
  if (loaded.has(key)) return Promise.resolve();
  const existing = inflight.get(key);
  if (existing) return existing;
  const p = loader()
    .then((m) => {
      loaded.add(key);
      inflight.delete(key);
      return m;
    })
    .catch((e) => {
      inflight.delete(key);
      throw e;
    });
  inflight.set(key, p);
  return p;
};

// Page loaders registry — keep in sync with App.tsx lazy()
export const routeLoaders: Record<string, Loader> = {
  "/dashboard": () => import("@/pages/Dashboard"),
  "/campaigns": () => import("@/pages/Campaigns"),
  "/my-submissions": () => import("@/pages/MySubmissions"),
  "/balance": () => import("@/pages/Balance"),
  "/affiliate": () => import("@/pages/Affiliate"),
  "/marketplace": () => import("@/pages/Marketplace"),
  "/messages": () => import("@/pages/Messages"),
  "/profile": () => import("@/pages/Profile"),
  "/support": () => import("@/pages/Support"),
  "/pricing": () => import("@/pages/Pricing"),
  "/about": () => import("@/pages/About"),
  "/contact": () => import("@/pages/Contact"),
  "/auth": () => import("@/pages/Auth"),
};

export const prefetchRoute = (path: string) => {
  const loader = routeLoaders[path];
  if (loader) prefetch(path, loader);
};

/** Idle-time warm-up of common nav targets after first paint. */
export const warmCommonRoutes = () => {
  if (typeof window === "undefined") return;
  const ric =
    (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void })
      .requestIdleCallback ||
    ((cb: () => void) => setTimeout(cb, 1200));
  ric(() => {
    ["/campaigns", "/dashboard", "/marketplace"].forEach(prefetchRoute);
  }, { timeout: 3000 } as never);
};
