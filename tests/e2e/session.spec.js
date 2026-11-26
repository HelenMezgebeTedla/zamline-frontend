import { expect, test } from "@playwright/test";
import {
  API,
  COMPANY_ID,
  PORTALS,
  company,
  mockApi,
  pendingEmail,
  signedIn,
} from "./helpers";

const EMAIL = "owner@lusakafreight.com";
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization",
};

function storedTokens(page) {
  return page.evaluate(() => ({
    access: sessionStorage.getItem("zamline_token"),
    refresh: sessionStorage.getItem("zamline_refresh_token"),
  }));
}

async function withRefreshToken(page, token) {
  await page.addInitScript((value) => {
    sessionStorage.setItem("zamline_refresh_token", value);
  }, token);
}

for (const portal of PORTALS) {
  test.describe(`${portal.label} session`, () => {
    test("keeps the refresh token after email verification", async ({
      page,
    }) => {
      await pendingEmail(page, EMAIL);
      await mockApi(page, {
        "POST /users/verify-otp": () => ({
          json: {
            access_token: "access-1",
            refresh_token: "refresh-1",
            token_type: "bearer",
            expires_in: 900,
          },
        }),
        "GET /users/me": () => ({ json: { company_id: COMPANY_ID } }),
        [`GET /companies/${COMPANY_ID}`]: () => ({
          json: company({ company_type: portal.type }),
        }),
      });
      await page.goto(`${portal.path}/verify-email`);
      await page.getByLabel("Digit 1").click();
      await page.keyboard.type("123456");
      await page.getByRole("button", { name: "Verify & Continue" }).click();
      await expect(page).toHaveURL(new RegExp(`${portal.path}/welcome$`));
      expect(await storedTokens(page)).toEqual({
        access: "access-1",
        refresh: "refresh-1",
      });
    });

    test("renews an expired session without logging out", async ({ page }) => {
      await signedIn(page, portal.key);
      await withRefreshToken(page, "refresh-1");
      let companyCalls = 0;
      const calls = await mockApi(page, {
        [`GET /companies/${COMPANY_ID}`]: () => {
          companyCalls += 1;
          return companyCalls === 1
            ? {
                status: 401,
                json: { detail: "Session expired. Please log in again." },
              }
            : {
                json: company({
                  company_type: portal.type,
                  verification_status: "verified",
                }),
              };
        },
        "POST /users/refresh": () => ({
          json: {
            access_token: "access-2",
            refresh_token: "refresh-2",
            token_type: "bearer",
            expires_in: 900,
          },
        }),
      });
      await page.goto(`${portal.path}/welcome`);
      await expect(page.locator(".auth-welcome-badge")).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`${portal.path}/welcome$`));
      const refreshes = calls.filter(
        (call) => call.key === "POST /users/refresh",
      );
      expect(refreshes).toHaveLength(1);
      expect(refreshes[0].body).toEqual({ refresh_token: "refresh-1" });
      expect(await storedTokens(page)).toEqual({
        access: "access-2",
        refresh: "refresh-2",
      });
    });

    test("sends you to login when the session cannot be renewed", async ({
      page,
    }) => {
      await signedIn(page, portal.key);
      await withRefreshToken(page, "refresh-old");
      await mockApi(page, {
        [`GET /companies/${COMPANY_ID}`]: () => ({
          status: 401,
          json: { detail: "Session expired. Please log in again." },
        }),
        "POST /users/refresh": () => ({
          status: 401,
          json: { detail: "Session expired. Please log in again." },
        }),
      });
      await page.goto(`${portal.path}/welcome`);
      await expect(page).toHaveURL(new RegExp(`${portal.path}/login`));
      expect(await storedTokens(page)).toEqual({ access: null, refresh: null });
    });

    for (const status of [429, 500]) {
      test(`keeps the session when renewal fails with ${status}`, async ({
        page,
      }) => {
        await signedIn(page, portal.key);
        await withRefreshToken(page, "refresh-1");
        await mockApi(page, {
          [`GET /companies/${COMPANY_ID}`]: () => ({
            status: 401,
            json: { detail: "Session expired. Please log in again." },
          }),
          "POST /users/refresh": () => ({
            status,
            json: { detail: "Try again later" },
          }),
        });
        await page.goto(`${portal.path}/welcome`);
        await expect(
          page.getByText(
            "We couldn't renew your session right now. Please try again in a moment.",
          ),
        ).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`${portal.path}/welcome$`));
        expect(await storedTokens(page)).toEqual({
          access: "test-token",
          refresh: "refresh-1",
        });
      });
    }

    test("tells you to wait after too many login attempts", async ({
      page,
    }) => {
      await mockApi(page, {
        "POST /users/login": () => ({
          status: 429,
          json: { detail: "Too many requests. Please try again later." },
        }),
      });
      await page.goto(`${portal.path}/login`);
      await page.locator("#email").fill(EMAIL);
      await page.locator("#password").fill("StrongPass123!");
      await page.getByRole("button", { name: "Log In" }).click();
      await expect(
        page.getByText(
          "Too many attempts. Please wait a few minutes and try again.",
        ),
      ).toBeVisible();
    });
  });
}

test("logging out ends the session on the server", async ({ page }) => {
  await signedIn(page, "shipper");
  await withRefreshToken(page, "refresh-1");
  const calls = await mockApi(page, {
    "GET /users/me": () => ({
      json: {
        user_id: "u1",
        company_id: COMPANY_ID,
        first_name: "Test",
        last_name: "Owner",
        email: EMAIL,
        role: "shipper",
      },
    }),
    [`GET /companies/${COMPANY_ID}`]: () => ({
      json: company({ verification_status: "verified" }),
    }),
    "POST /users/logout": () => ({ json: {} }),
  });
  await page.goto("/shipper/profile");
  if (test.info().project.name === "phone") {
    await page.getByRole("button", { name: "Open menu" }).click();
  }
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/shipper\/login/);
  await expect
    .poll(() => calls.filter((call) => call.key === "POST /users/logout"))
    .toHaveLength(1);
  expect(await storedTokens(page)).toEqual({ access: null, refresh: null });
});

test("a renewal that finishes after logout does not log you back in", async ({
  page,
}) => {
  let releaseRefresh;
  const refreshHeld = new Promise((resolve) => {
    releaseRefresh = resolve;
  });
  const calls = await mockApi(page, {
    "POST /users/refresh": async () => {
      await refreshHeld;
      return {
        json: {
          access_token: "access-2",
          refresh_token: "refresh-2",
          token_type: "bearer",
          expires_in: 900,
        },
      };
    },
    "POST /users/logout": () => ({ json: {} }),
  });
  await page.route(`${API}/users/me`, async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: CORS });
      return;
    }
    const renewed = request.headers()["authorization"] === "Bearer access-2";
    await route.fulfill({
      status: renewed ? 200 : 401,
      headers: CORS,
      contentType: "application/json",
      body: JSON.stringify(
        renewed
          ? {
              user_id: "u1",
              company_id: COMPANY_ID,
              first_name: "Test",
              last_name: "Owner",
              email: EMAIL,
              role: "shipper",
              terms_accepted: true,
            }
          : { detail: "Session expired. Please log in again." },
      ),
    });
  });
  await page.goto("/");
  await page.evaluate((companyId) => {
    sessionStorage.setItem("zamline_token", "test-token");
    sessionStorage.setItem("zamline_refresh_token", "refresh-1");
    sessionStorage.setItem("zamline_company_id", companyId);
    sessionStorage.setItem("zamline_role", "shipper");
    sessionStorage.setItem("zamline_verified", "true");
  }, COMPANY_ID);
  await page.goto("/shipper/profile");
  await expect
    .poll(() => calls.some((call) => call.key === "POST /users/refresh"))
    .toBe(true);
  if (test.info().project.name === "phone") {
    await page.getByRole("button", { name: "Open menu" }).click();
  }
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/shipper\/login/);
  releaseRefresh();
  await expect
    .poll(() => calls.filter((call) => call.key === "POST /users/refresh"))
    .toHaveLength(1);
  await page.waitForTimeout(500);
  expect(await storedTokens(page)).toEqual({ access: null, refresh: null });
});

test("a late 401 for an old token does not renew the session twice", async ({
  page,
}) => {
  await signedIn(page, "shipper");
  await withRefreshToken(page, "refresh-1");
  const calls = await mockApi(page, {
    [`GET /companies/${COMPANY_ID}`]: () => ({
      json: company({ verification_status: "verified" }),
    }),
    "GET /shipments": () => ({ json: [] }),
    "POST /users/refresh": () => ({
      json: {
        access_token: "access-2",
        refresh_token: "refresh-2",
        token_type: "bearer",
        expires_in: 900,
      },
    }),
  });
  let oldTokenCalls = 0;
  await page.route(`${API}/users/me`, async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: CORS });
      return;
    }
    const auth = request.headers()["authorization"];
    if (auth === "Bearer test-token") {
      oldTokenCalls += 1;
      if (oldTokenCalls > 1) await new Promise((r) => setTimeout(r, 1500));
      await route.fulfill({
        status: 401,
        headers: CORS,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Session expired." }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: CORS,
      contentType: "application/json",
      body: JSON.stringify({
        user_id: "u1",
        company_id: COMPANY_ID,
        first_name: "Test",
        last_name: "Owner",
        email: EMAIL,
        role: "shipper",
        terms_accepted: true,
      }),
    });
  });
  await page.goto("/shipper/dashboard");
  await expect.poll(() => oldTokenCalls).toBeGreaterThan(1);
  await page.waitForTimeout(2500);
  expect(
    calls.filter((call) => call.key === "POST /users/refresh"),
  ).toHaveLength(1);
  expect(await storedTokens(page)).toEqual({
    access: "access-2",
    refresh: "refresh-2",
  });
});
