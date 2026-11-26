import { apiRequest } from "./http";

export function getCurrentUser(signal) {
  return apiRequest("/users/me", { signal });
}
