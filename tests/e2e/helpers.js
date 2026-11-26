export const API = "http://api.test";
export const COMPANY_ID = "c0ffee00-0000-4000-8000-000000000001";
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization",
};
export async function mockApi(page, handlers = {}) {
  const calls = [];
  await page.route(`${API}/**`, async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: CORS });
      return;
    }
    const path = new URL(request.url()).pathname;
    const key = `${request.method()} ${path}`;
    let body = null;
    try {
      body = request.postDataJSON();
    } catch {
      body = null;
    }
    calls.push({ key, body });
    const handler = handlers[key];
    const result = handler
      ? await handler(body)
      : { status: 404, json: { detail: "Not Found" } };
    await route.fulfill({
      status: result.status ?? 200,
      headers: CORS,
      contentType: "application/json",
      body: JSON.stringify(result.json ?? {}),
    });
  });
  return calls;
}
export function company(overrides = {}) {
  return {
    company_id: COMPANY_ID,
    company_type: "shipper",
    business_name: "Lusaka Freight Ltd",
    registration_number: "120180010448",
    verification_status: "verified",
    verification_failure_reason: null,
    ...overrides,
  };
}
export async function signedIn(page, role, verified = true) {
  await page.addInitScript(
    ({ role, verified, companyId }) => {
      sessionStorage.setItem("zamline_token", "test-token");
      sessionStorage.setItem("zamline_company_id", companyId);
      sessionStorage.setItem("zamline_role", role);
      sessionStorage.setItem("zamline_verified", String(verified));
    },
    { role, verified, companyId: COMPANY_ID },
  );
}
export async function pendingEmail(page, email) {
  await page.addInitScript((value) => {
    sessionStorage.setItem("zamline_pending_email", value);
  }, email);
}
export const PORTALS = [
  { key: "shipper", path: "/shipper", label: "Shipper", type: "shipper" },
  { key: "fleet", path: "/fleet", label: "Fleet Manager", type: "fleet" },
];
