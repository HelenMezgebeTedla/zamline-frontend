"use client";

import { useLoad } from "@/hooks/useLoad";
import { loadAccount } from "@/lib/account";

export function useAccount(role, { enabled = true } = {}) {
  return useLoad(role, "account", () => loadAccount(), {
    enabled,
  });
}
