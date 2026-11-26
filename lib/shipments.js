import { apiRequest } from "./http";

export function listShipments(signal) {
  return apiRequest("/shipments", { signal });
}

export function getShipment(shipmentId, signal) {
  return apiRequest(`/shipments/${encodeURIComponent(shipmentId)}`, {
    signal,
  });
}

export function createShipment(payload) {
  return apiRequest("/shipments", { method: "POST", body: payload });
}

export function updateShipment(shipmentId, payload) {
  return apiRequest(`/shipments/${encodeURIComponent(shipmentId)}`, {
    method: "PATCH",
    body: payload,
  });
}

export function cancelShipment(shipmentId) {
  return apiRequest(`/shipments/${encodeURIComponent(shipmentId)}/cancel`, {
    method: "POST",
  });
}
