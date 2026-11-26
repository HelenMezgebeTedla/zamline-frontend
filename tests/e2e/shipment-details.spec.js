import { expect, test } from "@playwright/test";
import { openAsShipper, SHIPMENT_ID } from "./shipper-helpers";

const PATH = `/shipper/shipments/${SHIPMENT_ID}`;

test("shows the shipment details", async ({ page }) => {
  await openAsShipper(page, PATH);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kitwe");
  await expect(page.getByText("ZMW 18,500")).toBeVisible();
  await expect(page.getByText("Tarpaulin cover required.")).toBeVisible();
});

test("an open shipment can be edited or cancelled", async ({ page }) => {
  await openAsShipper(page, PATH);
  await expect(page.getByRole("link", { name: "Edit shipment" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cancel shipment" }),
  ).toBeVisible();
});

test("cancels after confirming", async ({ page }) => {
  const calls = await openAsShipper(page, PATH, {
    [`POST /shipments/${SHIPMENT_ID}/cancel`]: () => ({
      json: {
        shipment_id: SHIPMENT_ID,
        origin_address: "Kitwe",
        destination_address: "Lusaka",
        cargo_type: "Copper cathodes",
        weight_kg: 18000,
        required_body_type: "flatbed",
        pickup_time: "2030-06-18T08:00:00+02:00",
        special_requirements: null,
        proposed_amount: "18500.00",
        status: "cancelled",
        published_at: "2030-06-01T09:00:00+02:00",
      },
    }),
  });
  await page.getByRole("button", { name: "Cancel shipment" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("This can't be undone");
  await dialog.getByRole("button", { name: "Cancel shipment" }).click();
  await expect(page.getByText("Shipment cancelled")).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit shipment" })).toBeHidden();
  expect(calls.filter((call) => call.key.endsWith("/cancel"))).toHaveLength(1);
});

test("Keep shipment closes the dialog without cancelling", async ({ page }) => {
  const calls = await openAsShipper(page, PATH);
  await page.getByRole("button", { name: "Cancel shipment" }).click();
  await page.getByRole("button", { name: "Keep shipment" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  expect(calls.filter((call) => call.key.endsWith("/cancel"))).toHaveLength(0);
});

test("an accepted shipment cannot be edited", async ({ page }) => {
  await openAsShipper(page, PATH, {}, { shipment: { status: "confirmed" } });
  await expect(
    page.getByText("A fleet company has accepted this shipment"),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit shipment" })).toBeHidden();
});

test("an unknown shipment shows a not-found message", async ({ page }) => {
  await openAsShipper(page, "/shipper/shipments/does-not-exist");
  await expect(page.getByText("Shipment not found")).toBeVisible();
});
