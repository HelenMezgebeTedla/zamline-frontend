import { COMPANY_ID, company, mockApi, signedIn } from "./helpers";

export const SHIPMENT_ID = "5a1e0000-0000-4000-8000-000000000001";

export function shipment(overrides = {}) {
  return {
    shipment_id: SHIPMENT_ID,
    company_id: COMPANY_ID,
    user_id: "u5e70000-0000-4000-8000-000000000001",
    origin_address: "Kitwe",
    destination_address: "Lusaka",
    cargo_type: "Copper cathodes",
    weight_kg: 18000,
    required_body_type: "flatbed",
    pickup_time: "2030-06-18T08:00:00+02:00",
    special_requirements: "Tarpaulin cover required.",
    proposed_amount: "18500.00",
    status: "open",
    published_at: "2030-06-01T09:00:00+02:00",
    ...overrides,
  };
}

export async function openAsShipper(page, path, handlers = {}, options = {}) {
  await signedIn(page, "shipper");
  const calls = await mockApi(page, {
    "GET /users/me": () => ({
      json: {
        company_id: COMPANY_ID,
        first_name: "Sandra",
        last_name: "Twala",
      },
    }),
    [`GET /companies/${COMPANY_ID}`]: () => ({
      json: company({ company_type: "shipper", ...options.company }),
    }),
    "GET /shipments": () => ({ json: options.shipments ?? [shipment()] }),
    [`GET /shipments/${SHIPMENT_ID}`]: () => ({
      json: shipment(options.shipment),
    }),
    ...handlers,
  });
  await page.goto(path);
  return calls;
}
