import { expect, test } from "@playwright/test";
import { mockApi } from "./helpers";
import { openAsShipper } from "./shipper-helpers";

test("sends a signed-out visitor to the login page", async ({ page }) => {
  await page.goto("/shipper/dashboard");
  await expect(page).toHaveURL(/\/shipper\/login$/);
});

test("sends an unverified shipper to the welcome page", async ({ page }) => {
  await openAsShipper(
    page,
    "/shipper/dashboard",
    {},
    {
      company: { verification_status: "pending" },
    },
  );
  await expect(page).toHaveURL(/\/shipper\/welcome$/);
});

test("sends a fleet account to the fleet side", async ({ page }) => {
  await openAsShipper(
    page,
    "/shipper/dashboard",
    {},
    {
      company: { company_type: "fleet" },
    },
  );
  await expect(page).toHaveURL(/\/fleet\/welcome$/);
});

test("keeps the session and offers Retry when the server fails", async ({
  page,
}) => {
  await openAsShipper(page, "/shipper/dashboard", {
    "GET /users/me": () => ({ status: 503, json: { detail: "Down" } }),
  });
  await expect(page).toHaveURL(/\/shipper\/dashboard$/);
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  const token = await page.evaluate(() =>
    sessionStorage.getItem("zamline_token"),
  );
  expect(token).toBe("test-token");
});

test("logs out when the session has expired", async ({ page }) => {
  await openAsShipper(page, "/shipper/dashboard", {
    "GET /users/me": () => ({ status: 401, json: { detail: "Expired" } }),
  });
  await expect(page).toHaveURL(/\/shipper\/login$/);
});

test("the server is never called without a token", async ({ page }) => {
  const calls = await mockApi(page);
  await page.goto("/shipper/shipments/new");
  await expect(page).toHaveURL(/\/shipper\/login$/);
  expect(calls).toHaveLength(0);
});
