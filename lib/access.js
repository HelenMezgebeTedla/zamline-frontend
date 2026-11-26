import { getRole } from "@/lib/roles";

export function wrongPortal(pageRole, companyType) {
  const account = getRole(companyType);
  return account && account.key !== pageRole ? account : null;
}

export function accessRedirect({
  token,
  myRole,
  verified,
  role,
  requireVerified,
}) {
  const page = getRole(role);
  const mine = getRole(myRole);

  if (!token || !mine) return `${page.basePath}/login`;
  if (mine.key !== page.key) return `${mine.basePath}/welcome`;
  if (requireVerified && !verified) return `${page.basePath}/welcome`;
  return null;
}
