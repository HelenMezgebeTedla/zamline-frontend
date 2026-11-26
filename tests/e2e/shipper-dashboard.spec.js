import { expect, test } from "@playwright/test";
import { openAsShipper, shipment } from "./shipper-helpers";

const SHIPMENTS = [
  shipment(),
  shipment({
    shipment_id: "second",
    origin_address: "Ndola",
    status: "confirmed",
  }),
  shipment({ shipment_id: "third", status: "cancelled" }),
];

test("greets the shipper by name", async ({ page }) => {
  await openAsShipper(page, "/shipper/dashboard");
  await expect(
    page.getByRole("heading", { name: "Welcome, Sandra" }),
  ).toBeVisible();
});

function statCard(page, label) {
  return page.getByText(label, { exact: true }).locator("..");
}

test("counts active, accepted and total shipments", async ({ page }) => {
  await openAsShipper(page, "/shipper/dashboard", {}, { shipments: SHIPMENTS });
  await expect(statCard(page, "Active postings")).toContainText("1");
  await expect(statCard(page, "Accepted shipments")).toContainText("1");
  await expect(statCard(page, "Total posted")).toContainText("3");
});

test("shows an empty state when nothing is posted", async ({ page }) => {
  await openAsShipper(page, "/shipper/dashboard", {}, { shipments: [] });
  await expect(page.getByText("No shipments yet")).toBeVisible();
});

test("shows an error with Try again when shipments fail to load", async ({
  page,
}) => {
  await openAsShipper(page, "/shipper/dashboard", {
    "GET /shipments": () => ({ status: 503, json: { detail: "Down" } }),
  });
  await expect(page.getByText("We couldn't load your shipments")).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("Post new shipment opens the form", async ({ page }) => {
  await openAsShipper(page, "/shipper/dashboard");
  await page.getByRole("link", { name: "Post new shipment" }).click();
  await expect(page).toHaveURL(/\/shipper\/shipments\/new$/);
});
