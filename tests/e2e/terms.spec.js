import { expect, test } from "@playwright/test";
import {
  COMPANY_ID,
  PORTALS,
  company,
  mockApi,
  pendingEmail,
  signedIn,
} from "./helpers";

const EMAIL = "owner@lusakafreight.com";
const TERMS_REQUIRED = "Please accept the Terms and Policy to continue.";

const CERTIFICATE = {
  name: "pacra.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4 test certificate"),
};

async function fillSignup(page) {
  const values = {
    business_name: "Lusaka Freight Ltd",
    registration_number: "120180010448",
    company_email: EMAIL,
    phone_number: "+260971234567",
    first_name: "Mary",
    last_name: "Banda",
    password: "Kafue#River2026",
    confirm_password: "Kafue#River2026",
  };
  for (const [field, value] of Object.entries(values)) {
    await page.locator(`#${field}`).fill(value);
  }
  await page.locator('input[type="file"]').setInputFiles(CERTIFICATE);
}

function me(overrides = {}) {
  return {
    user_id: "u1",
    company_id: COMPANY_ID,
    first_name: "Mary",
    last_name: "Banda",
    email: EMAIL,
    role: "shipper",
    terms_accepted: true,
    ...overrides,
  };
}

test("the Terms and Policy page can be read without logging in", async ({
  page,
}) => {
  await page.goto("/terms");
  await expect(
    page.getByRole("heading", { name: "Terms and Policy" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "8. Your data and privacy" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Accept and continue" }),
  ).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Back" })).toBeVisible();
});

for (const portal of PORTALS) {
  test.describe(`${portal.label} terms`, () => {
    test("sign-up is refused until the terms are accepted", async ({
      page,
    }) => {
      const calls = await mockApi(page);
      await page.goto(`${portal.path}/signup`);
      await fillSignup(page);
      await page.getByRole("button", { name: "Create Account" }).click();
      await expect(page.locator(".auth-signup-error")).toHaveText(
        "Please accept the Terms and Policy to create your account.",
      );
      expect(calls.some((call) => call.key === "POST /users/register")).toBe(
        false,
      );
    });

    test("sign-up sends the accepted terms", async ({ page }) => {
      const calls = await mockApi(page, {
        "POST /users/register": () => ({
          status: 201,
          json: {
            user: me({ role: portal.type }),
            company: company({ company_type: portal.type }),
          },
        }),
      });
      await page.goto(`${portal.path}/signup`);
      await expect(
        page.getByRole("link", { name: "Terms and Policy" }),
      ).toHaveAttribute("href", "/terms");
      await fillSignup(page);
      await page.locator("#accept_terms").check();
      await page.getByRole("button", { name: "Create Account" }).click();
      await expect(page).toHaveURL(new RegExp(`${portal.path}/verify-email$`));
      const register = calls.find(
        (call) => call.key === "POST /users/register",
      );
      expect(register.body.accept_terms).toBe(true);
    });

    test("an existing user must accept the terms after logging in", async ({
      page,
    }) => {
      let accepted = false;
      await pendingEmail(page, EMAIL);
      const calls = await mockApi(page, {
        "POST /users/verify-otp": () => ({
          json: {
            access_token: "access-1",
            refresh_token: "refresh-1",
            token_type: "bearer",
            expires_in: 900,
          },
        }),
        "GET /users/me": () => ({
          json: me({
            role: portal.key === "fleet" ? "fleet_manager" : "shipper",
            terms_accepted: accepted,
          }),
        }),
        "POST /users/accept-terms": () => {
          accepted = true;
          return { json: me({ terms_accepted: true }) };
        },
        [`GET /companies/${COMPANY_ID}`]: () =>
          accepted
            ? { json: company({ company_type: portal.type }) }
            : { status: 403, json: { detail: TERMS_REQUIRED } },
      });
      await page.goto(`${portal.path}/verify-email`);
      await page.getByLabel("Digit 1").click();
      await page.keyboard.type("123456");
      await page.getByRole("button", { name: "Verify & Continue" }).click();

      await expect(page).toHaveURL(/\/terms\?next=/);
      await page.getByRole("button", { name: "Accept and continue" }).click();
      await expect(page.locator(".auth-terms-error")).toHaveText(
        "Tick the box to confirm you agree to the Terms and Policy.",
      );
      expect(
        calls.some((call) => call.key === "POST /users/accept-terms"),
      ).toBe(false);

      await page
        .getByLabel("I have read and agree to the ZamLine Terms and Policy")
        .check();
      await page.getByRole("button", { name: "Accept and continue" }).click();
      await expect(page).toHaveURL(new RegExp(`${portal.path}/welcome$`));
      expect(
        calls.filter((call) => call.key === "POST /users/accept-terms"),
      ).toHaveLength(1);
    });

    test("declining the terms logs you out", async ({ page }) => {
      await signedIn(page, portal.key);
      const calls = await mockApi(page, {
        "GET /users/me": () => ({
          json: me({
            role: portal.key === "fleet" ? "fleet_manager" : "shipper",
            terms_accepted: false,
          }),
        }),
        "POST /users/logout": () => ({ json: {} }),
      });
      await page.goto("/terms");
      await page.getByRole("button", { name: "Decline and log out" }).click();
      await expect(page).toHaveURL(new RegExp(`${portal.path}/login$`));
      await expect
        .poll(() => calls.filter((call) => call.key === "POST /users/logout"))
        .toHaveLength(1);
      const token = await page.evaluate(() =>
        sessionStorage.getItem("zamline_token"),
      );
      expect(token).toBeNull();
    });
  });
}

test("the dashboard sends you to the terms when the server asks", async ({
  page,
}) => {
  await signedIn(page, "shipper");
  await mockApi(page, {
    "GET /users/me": () => ({ json: me({ terms_accepted: false }) }),
    [`GET /companies/${COMPANY_ID}`]: () => ({
      status: 403,
      json: { detail: TERMS_REQUIRED },
    }),
  });
  await page.goto("/shipper/dashboard");
  await expect(page).toHaveURL(
    `/terms?next=${encodeURIComponent("/shipper/dashboard")}`,
  );
  await expect(
    page.getByRole("button", { name: "Accept and continue" }),
  ).toBeVisible();
});

test("after accepting you go back to the page you asked for", async ({
  page,
}) => {
  await signedIn(page, "shipper");
  let accepted = false;
  await mockApi(page, {
    "GET /users/me": () => ({ json: me({ terms_accepted: accepted }) }),
    "POST /users/accept-terms": () => {
      accepted = true;
      return { json: me() };
    },
    [`GET /companies/${COMPANY_ID}`]: () => ({ json: company() }),
    "GET /shipments": () => ({ json: [] }),
  });
  await page.goto(`/terms?next=${encodeURIComponent("/shipper/shipments")}`);
  await page
    .getByLabel("I have read and agree to the ZamLine Terms and Policy")
    .check();
  await page.getByRole("button", { name: "Accept and continue" }).click();
  await expect(page).toHaveURL(/\/shipper\/shipments$/);
});

test("a link to another website is never followed", async ({ page }) => {
  await signedIn(page, "shipper");
  let accepted = false;
  await mockApi(page, {
    "GET /users/me": () => ({ json: me({ terms_accepted: accepted }) }),
    "POST /users/accept-terms": () => {
      accepted = true;
      return { json: me() };
    },
    [`GET /companies/${COMPANY_ID}`]: () => ({ json: company() }),
  });
  await page.goto(`/terms?next=${encodeURIComponent("//evil.example.com")}`);
  await page
    .getByLabel("I have read and agree to the ZamLine Terms and Policy")
    .check();
  await page.getByRole("button", { name: "Accept and continue" }).click();
  await expect(page).toHaveURL(/\/shipper\/welcome$/);
});
