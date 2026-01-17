// Redirect intent helpers (campaign deep-link -> auth -> back)

const REDIRECT_KEY = "zyrozo_post_auth_redirect";
const REDIRECT_TS_KEY = "zyrozo_post_auth_redirect_ts";
const MAX_AGE_MS = 1000 * 60 * 60; // 1 hour

export const sanitizeRedirectPath = (input?: string | null): string | null => {
  if (!input) return null;

  let value = input;
  try {
    // tolerate encoded query params
    value = decodeURIComponent(input);
  } catch {
    // keep raw
  }

  // Only allow internal paths
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.includes("://")) return null;
  if (value.length > 2048) return null;

  // Prevent redirect loops
  if (value.startsWith("/auth")) return null;

  return value;
};

export const setRedirectIntent = (path: string) => {
  const safe = sanitizeRedirectPath(path);
  if (!safe) return;

  try {
    localStorage.setItem(REDIRECT_KEY, safe);
    localStorage.setItem(REDIRECT_TS_KEY, Date.now().toString());
  } catch {
    // ignore storage errors
  }
};

export const getRedirectIntent = (): string | null => {
  try {
    const raw = localStorage.getItem(REDIRECT_KEY);
    const tsRaw = localStorage.getItem(REDIRECT_TS_KEY);
    const ts = tsRaw ? Number(tsRaw) : 0;

    if (!raw) return null;
    if (!ts || Number.isNaN(ts)) return sanitizeRedirectPath(raw);

    if (Date.now() - ts > MAX_AGE_MS) {
      clearRedirectIntent();
      return null;
    }

    return sanitizeRedirectPath(raw);
  } catch {
    return null;
  }
};

export const clearRedirectIntent = () => {
  try {
    localStorage.removeItem(REDIRECT_KEY);
    localStorage.removeItem(REDIRECT_TS_KEY);
  } catch {
    // ignore
  }
};

export const consumeRedirectIntent = (): string | null => {
  const intent = getRedirectIntent();
  clearRedirectIntent();
  return intent;
};
