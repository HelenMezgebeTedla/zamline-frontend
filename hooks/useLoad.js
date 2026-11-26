"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { signOut } from "@/lib/account";
import { session } from "@/lib/api";
import { NAVIGATION } from "@/lib/navigation";

export function useLoad(role, key, load, { enabled = true } = {}) {
  const router = useRouter();
  const loadRef = useRef(load);
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState({
    key: null,
    data: null,
    error: null,
  });

  useEffect(() => {
    loadRef.current = load;
  });

  const requestKey = `${key}#${version}`;

  useEffect(() => {
    if (!enabled) return;
    if (!session.getToken()) return;
    let alive = true;
    loadRef
      .current()
      .then((data) => {
        if (alive) setResult({ key: requestKey, data, error: null });
      })
      .catch((error) => {
        if (!alive) return;
        if (error.status === 401) {
          signOut();
          router.replace(NAVIGATION[role].loginHref);
          return;
        }
        setResult({ key: requestKey, data: null, error });
      });
    return () => {
      alive = false;
    };
  }, [enabled, requestKey, role, router]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);
  const replace = useCallback(
    (data) => setResult((current) => ({ ...current, data })),
    [],
  );

  return {
    data: result.data,
    error: result.error,
    loading: result.key !== requestKey,
    reload,
    replace,
  };
}
