import { expect, test } from "@playwright/test";
import { openAsShipper } from "./shipper-helpers";

test("sidebar shows the shipper's name and links", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "The sidebar is hidden behind the menu on phones");
  await openAsShipper(page, "/shipper/dashboard");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(
    page.getByRole("complementary").getByText("Sandra Twala"),
  ).toBeVisible();
  await nav.getByRole("link", { name: "Post Shipment" }).click();
  await expect(page).toHaveURL(/\/shipper\/shipments\/new$/);
});

test("breadcrumbs follow the current page", async ({ page }) => {
  await openAsShipper(page, "/shipper/shipments");
  const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(crumbs).toContainText("Shipper");
  await expect(crumbs).toContainText("Current Shipments");
});

test("mobile menu opens, closes with Escape and returns focus", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "The menu button only shows on phones");
  await openAsShipper(page, "/shipper/dashboard");
  const menuButton = page.getByRole("button", { name: "Open menu" });
  await menuButton.click();
  await expect(page.getByRole("dialog", { name: "Main menu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close menu" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Main menu" })).toBeHidden();
  await expect(menuButton).toBeFocused();
});

test("log out clears the session and opens the login page", async ({
  page,
  isMobile,
}) => {
  await openAsShipper(page, "/shipper/dashboard");
  if (isMobile) await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/shipper\/login$/);
  const token = await page.evaluate(() =>
    sessionStorage.getItem("zamline_token"),
  );
  expect(token).toBeNull();
});
