import { api, session } from "@/lib/api";

let cached = null;

export function loadAccount({ fresh = false } = {}) {
  const token = session.getToken();
  if (!fresh && cached && cached.token === token) return cached.promise;

  const promise = api("/users/me", { auth: true }).then(async (user) => {
    const company = await api(`/companies/${user.company_id}`, { auth: true });
    return { user, company };
  });
  cached = { token, promise };
  promise.catch(() => {
    if (cached?.promise === promise) cached = null;
  });
  return promise;
}

export function signOut() {
  cached = null;
  session.setToken(null);
  session.setCompanyId(null);
  session.setRole(null);
  session.setVerified(null);
  session.setEmail(null);
}
