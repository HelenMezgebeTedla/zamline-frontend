import { session as authSession } from "@/lib/api";

const listeners = new Set();

let cachedKey;
let cachedSession = null;

function readSession() {
  return {
    token: authSession.getToken(),
    companyId: authSession.getCompanyId(),
    role: authSession.getRole(),
    verified: authSession.getVerified(),
  };
}

export function getSession() {
  if (typeof window === "undefined") return null;
  const current = readSession();
  const key = JSON.stringify(current);
  if (key !== cachedKey) {
    cachedKey = key;
    cachedSession = current.token ? current : null;
  }
  return cachedSession;
}

export function clearSession() {
  authSession.setToken(null);
  authSession.setCompanyId(null);
  authSession.setRole(null);
  authSession.setVerified(null);
  authSession.setEmail(null);
  for (const listener of listeners) listener();
}

export function subscribeSession(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
