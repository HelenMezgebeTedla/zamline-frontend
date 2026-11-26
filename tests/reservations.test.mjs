import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatPickup,
  formatWeight,
  fullName,
  initials,
  routeLabel,
  routeSentence,
  titleCase,
  toDateInputValue,
} from "../lib/format.js";
import {
  acceptErrorMessage,
  counterpartyName,
  filterReservations,
  statusLabel,
} from "../lib/reservationView.js";

const KITWE = {
  origin_address: "Kitwe, Zambia",
  destination_address: "Lusaka, Zambia",
  cargo_type: "copper_cathodes",
  fleet_company_name: "Kafue Logistics Ltd",
  shipper_company_name: "Copperbelt Mining",
  plate_number: "BAZ 1001",
  pickup_time: "2026-06-18T06:00:00+00:00",
};

const NDOLA = {
  origin_address: "Ndola, Zambia",
  destination_address: "Lusaka, Zambia",
  cargo_type: "machinery",
  fleet_company_name: "Northstar Haulage",
  shipper_company_name: "Ndola Farms",
  plate_number: "BAZ 2002",
  pickup_time: "2026-06-20T08:30:00+00:00",
};

test("formats money the way the designs show it", () => {
  assert.equal(formatMoney("18500.00"), "ZMW 18,500");
  assert.equal(formatMoney(null), "—");
  assert.equal(formatMoney("abc"), "—");
});

test("formats weights, dates and pickup times", () => {
  assert.equal(formatWeight(18000), "18,000 kg");
  assert.equal(formatWeight(0), "—");
  assert.equal(formatDate("2026-06-18T06:00:00+00:00"), "18 Jun 2026");
  assert.equal(
    formatPickup("2026-06-18T06:00:00+00:00"),
    "18 Jun 2026 at 08:00 CAT",
  );
  assert.equal(
    formatDateTime("2026-06-18T06:00:00+00:00"),
    "18 Jun 2026 · 08:00 CAT",
  );
  assert.equal(formatPickup(null), "—");
  assert.equal(toDateInputValue("2026-06-18T06:00:00+00:00"), "2026-06-18");
});

test("shows pickup times in Zambia time wherever the browser is", () => {
  assert.equal(
    formatPickup("2026-06-18T08:00:00+03:00"),
    "18 Jun 2026 at 07:00 CAT",
  );
  assert.equal(toDateInputValue("2026-06-17T23:30:00+00:00"), "2026-06-18");
  assert.equal(toDateInputValue("2026-06-18T21:59:00+00:00"), "2026-06-18");
  assert.equal(toDateInputValue("2026-06-18T22:00:00+00:00"), "2026-06-19");
});

test("builds route labels from full addresses", () => {
  assert.equal(
    routeLabel(KITWE.origin_address, KITWE.destination_address),
    "Kitwe → Lusaka",
  );
  assert.equal(
    routeSentence(KITWE.origin_address, KITWE.destination_address),
    "Kitwe to Lusaka",
  );
});

test("builds names and initials for the profile and sidebar", () => {
  assert.equal(
    fullName({ first_name: "Alex", last_name: "Morgan" }),
    "Alex Morgan",
  );
  assert.equal(initials("Alex Morgan"), "AM");
  assert.equal(initials("Fleet Manager Account"), "FA");
  assert.equal(initials(""), "?");
  assert.equal(titleCase("copper_cathodes"), "Copper Cathodes");
});

test("shows the other company in the booking", () => {
  assert.equal(counterpartyName(KITWE, "shipper"), "Kafue Logistics Ltd");
  assert.equal(counterpartyName(KITWE, "fleet"), "Copperbelt Mining");
});

test("searches by route, cargo, company and truck", () => {
  const items = [KITWE, NDOLA];
  assert.deepEqual(filterReservations(items, { query: "kitwe" }), [KITWE]);
  assert.deepEqual(filterReservations(items, { query: "northstar" }), [NDOLA]);
  assert.deepEqual(filterReservations(items, { query: "copper cathodes" }), [
    KITWE,
  ]);
  assert.deepEqual(filterReservations(items, { query: "baz 2002" }), [NDOLA]);
  assert.deepEqual(filterReservations(items, { query: "  " }), items);
});

test("filters by pickup date", () => {
  const items = [KITWE, NDOLA];
  assert.deepEqual(filterReservations(items, { date: "2026-06-20" }), [NDOLA]);
  assert.deepEqual(
    filterReservations(items, { query: "kitwe", date: "2026-06-20" }),
    [],
  );
});

test("labels statuses for people", () => {
  assert.equal(statusLabel("accepted"), "Active");
  assert.equal(statusLabel("cancelled"), "Cancelled");
  assert.equal(statusLabel("pending"), "Awaiting decision");
});

test("turns accept errors into clear messages", () => {
  assert.equal(
    acceptErrorMessage(409, "Load already claimed").title,
    "Another fleet company booked this load first",
  );
  assert.equal(
    acceptErrorMessage(403, "Your company is not verified yet").title,
    "Your company is not verified yet",
  );
  assert.equal(
    acceptErrorMessage(404, "Match not found").title,
    "Opportunity not found",
  );
  assert.equal(
    acceptErrorMessage(500, "").message,
    "Something went wrong. Please try again.",
  );
});
