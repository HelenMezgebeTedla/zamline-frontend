let lastHash = null;
let lastLink = null;

export function readEmailLink() {
  const hash = window.location.hash;
  if (hash === lastHash) return lastLink;
  lastHash = hash;

  const params = new URLSearchParams(hash.slice(1));
  const email = (params.get("email") || "").trim().toLowerCase();
  const code = params.get("code") || "";
  lastLink =
    /^[0-9]{6}$/.test(code) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? { email, code }
      : null;
  return lastLink;
}

export function noEmailLink() {
  return null;
}

export function subscribeToNothing() {
  return () => {};
}
