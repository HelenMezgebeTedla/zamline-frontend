"use client";

import { useResource } from "@/hooks/useResource";
import { useSession } from "@/hooks/useSession";
import { getCurrentUser } from "@/lib/users";

export function useCurrentUser() {
  const session = useSession();
  const { data } = useResource(
    session?.token ? "current-user" : null,
    getCurrentUser,
  );
  return data ?? null;
}
