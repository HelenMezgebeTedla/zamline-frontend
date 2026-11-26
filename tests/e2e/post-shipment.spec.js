import { expect, test } from "@playwright/test";
import { openAsShipper, shipment } from "./shipper-helpers";

async function fillForm(page) {
  await page.locator("#origin_address").fill("Kitwe");
  await page.locator("#destination_address").fill("Lusaka");
  await page.locator("#cargo_choice").selectOption("Copper cathodes");
  const bodyType = page.locator("#required_body_type");
  if (await bodyType.count()) await bodyType.selectOption("flatbed");
  await page.locator("#weight_kg").fill("18000");
  await page.locator("#pickup_date").fill("2030-06-18");
  await page.locator("#pickup_time").fill("08:00");
  await page.locator("#proposed_amount").fill("18500");
}

test("asks for the missing details without calling the server", async ({
  page,
}) => {
  const calls = await openAsShipper(page, "/shipper/shipments/new");
  await page.getByRole("button", { name: "Post shipment" }).click();
  await expect(
    page.getByText("Enter where the cargo will be collected"),
  ).toBeVisible();
  await expect(page.getByText("Choose the type of cargo")).toBeVisible();
  expect(calls.filter((call) => call.key === "POST /shipments")).toHaveLength(
    0,
  );
});

test("refuses the same origin and destination", async ({ page }) => {
  await openAsShipper(page, "/shipper/shipments/new");
  await page.locator("#origin_address").fill("Lusaka");
  await page.locator("#destination_address").fill("lusaka");
  await page.locator("#destination_address").blur();
  await expect(
    page.getByText("Destination must be different from the origin"),
  ).toBeVisible();
});

test("refuses a pickup in the past", async ({ page }) => {
  const calls = await openAsShipper(page, "/shipper/shipments/new");
  await expect(async () => {
    await page.locator("#pickup_date").fill("2020-01-01");
    await page.locator("#pickup_time").fill("08:00");
    await page.getByRole("button", { name: "Post shipment" }).click();
    await expect(
      page.getByText("Pickup date and time must be in the future"),
    ).toBeVisible({ timeout: 1000 });
  }).toPass();
  expect(calls.filter((call) => call.key === "POST /shipments")).toHaveLength(
    0,
  );
});

test("Other cargo asks the shipper to describe it", async ({ page }) => {
  await openAsShipper(page, "/shipper/shipments/new");
  await page.locator("#cargo_choice").selectOption("__other__");
  await expect(page.locator("#cargo_other")).toBeVisible();
});

test("posts the shipment and opens its details", async ({ page }) => {
  const calls = await openAsShipper(page, "/shipper/shipments/new", {
    "POST /shipments": () => ({
      status: 201,
      json: shipment({ shipment_id: "new-shipment" }),
    }),
    "GET /shipments/new-shipment": () => ({
      json: shipment({ shipment_id: "new-shipment" }),
    }),
  });
  await fillForm(page);
  await page.getByRole("button", { name: "Post shipment" }).click();
  await expect(page).toHaveURL(/\/shipper\/shipments\/new-shipment/);
  await expect(page.getByText("Shipment posted")).toBeVisible();
  const post = calls.find((call) => call.key === "POST /shipments");
  expect(post.body).toMatchObject({
    origin_address: "Kitwe",
    destination_address: "Lusaka",
    cargo_type: "Copper cathodes",
    weight_kg: 18000,
    pickup_date: "2030-06-18",
    pickup_time: "08:00",
    proposed_amount: 18500,
    special_requirements: null,
  });
});

test("shows the server error under the right field", async ({ page }) => {
  await openAsShipper(page, "/shipper/shipments/new", {
    "POST /shipments": () => ({
      status: 422,
      json: {
        detail: [
          {
            loc: ["body", "weight_kg"],
            msg: "Value error, Weight is too high",
          },
        ],
      },
    }),
  });
  await fillForm(page);
  await page.getByRole("button", { name: "Post shipment" }).click();
  await expect(page.getByText("Weight is too high")).toBeVisible();
});
