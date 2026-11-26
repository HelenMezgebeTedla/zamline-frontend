import { expect, test } from "@playwright/test";
import { openAsShipper, shipment, SHIPMENT_ID } from "./shipper-helpers";

const PATH = `/shipper/shipments/${SHIPMENT_ID}/edit`;

test("fills the form with the current details", async ({ page }) => {
  await openAsShipper(page, PATH);
  await expect(page.locator("#origin_address")).toHaveValue("Kitwe");
  await expect(page.locator("#destination_address")).toHaveValue("Lusaka");
  await expect(page.locator("#weight_kg")).toHaveValue("18000");
});

test("Save changes stays disabled until something changes", async ({
  page,
}) => {
  await openAsShipper(page, PATH);
  const save = page.getByRole("button", { name: "Save changes" });
  await expect(save).toBeDisabled();
  await page.locator("#destination_address").fill("Livingstone");
  await expect(save).toBeEnabled();
});

test("sends only the changed details", async ({ page }) => {
  const calls = await openAsShipper(page, PATH, {
    [`PATCH /shipments/${SHIPMENT_ID}`]: () => ({
      json: shipment({ destination_address: "Livingstone" }),
    }),
  });
  await page.locator("#destination_address").fill("Livingstone");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(new RegExp(`/shipper/shipments/${SHIPMENT_ID}`));
  await expect(page.getByText("Changes saved")).toBeVisible();
  const patch = calls.find((call) => call.key.startsWith("PATCH"));
  expect(patch.body).toEqual({ destination_address: "Livingstone" });
});

test("Cancel goes back without saving", async ({ page }) => {
  const calls = await openAsShipper(page, PATH);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`/shipper/shipments/${SHIPMENT_ID}$`),
  );
  expect(calls.filter((call) => call.key.startsWith("PATCH"))).toHaveLength(0);
});

test("a shipment that is not open cannot be edited", async ({ page }) => {
  await openAsShipper(page, PATH, {}, { shipment: { status: "cancelled" } });
  await expect(page.getByText("This shipment is cancelled")).toBeVisible();
  await expect(page.locator("form")).toHaveCount(0);
});
