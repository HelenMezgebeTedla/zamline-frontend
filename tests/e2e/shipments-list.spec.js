import { expect, test } from "@playwright/test";
import { openAsShipper, shipment, SHIPMENT_ID } from "./shipper-helpers";

const SHIPMENTS = [
  shipment(),
  shipment({
    shipment_id: "second",
    origin_address: "Ndola",
    cargo_type: "Maize",
    status: "cancelled",
    pickup_time: "2030-07-01T09:00:00+02:00",
  }),
];

function visible(page, text) {
  return page.getByText(text).filter({ visible: true }).first();
}

test("lists every shipment", async ({ page }) => {
  await openAsShipper(page, "/shipper/shipments", {}, { shipments: SHIPMENTS });
  await expect(page.getByText("2 shipments")).toBeVisible();
  await expect(visible(page, "Kitwe")).toBeVisible();
  await expect(visible(page, "Ndola")).toBeVisible();
});

test("search filters by cargo or route", async ({ page }) => {
  await openAsShipper(page, "/shipper/shipments", {}, { shipments: SHIPMENTS });
  await page.getByLabel("Search by route or cargo").fill("maize");
  await expect(page.getByText("1 of 2")).toBeVisible();
  await expect(visible(page, "Ndola")).toBeVisible();
});

test("status and date filters work and can be cleared", async ({ page }) => {
  await openAsShipper(page, "/shipper/shipments", {}, { shipments: SHIPMENTS });
  await page.getByLabel("Status").selectOption("cancelled");
  await expect(page.getByText("1 of 2")).toBeVisible();
  await page.getByLabel("Status").selectOption("all");
  await page.getByLabel("Pickup date").fill("2030-06-18");
  await expect(page.getByText("1 of 2")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).first().click();
  await expect(page.getByText("2 shipments")).toBeVisible();
});

test("shows a message when no shipment matches", async ({ page }) => {
  await openAsShipper(page, "/shipper/shipments", {}, { shipments: SHIPMENTS });
  await page.getByLabel("Search by route or cargo").fill("timber");
  await expect(page.getByText("No shipments match your filters")).toBeVisible();
});

test("View details opens the shipment", async ({ page }) => {
  await openAsShipper(page, "/shipper/shipments");
  await page
    .locator(`a[href="/shipper/shipments/${SHIPMENT_ID}"]`)
    .filter({ visible: true })
    .first()
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/shipper/shipments/${SHIPMENT_ID}$`),
  );
});
