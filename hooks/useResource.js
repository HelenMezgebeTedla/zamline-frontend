"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { isAbortError, toError } from "@/lib/http";

export function useResource(key, load) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState(null);
  const requestKey = key === null ? null : `${key}#${version}`;
  const runLoad = useEffectEvent(load);

  useEffect(() => {
    if (key === null || requestKey === null) return;
    const controller = new AbortController();
    runLoad(controller.signal).then(
      (data) => setResult({ requestKey, key, data }),
      (error) => {
        if (isAbortError(error) || controller.signal.aborted) return;
        setResult({ requestKey, key, error: toError(error) });
      },
    );
    return () => controller.abort();
  }, [key, requestKey]);

  const sameKey = result !== null && result.key === key;
  const isLoading = requestKey !== null && result?.requestKey !== requestKey;

  const reload = useCallback(() => setVersion((value) => value + 1), []);

  const setData = useCallback(
    (data) => {
      if (key === null || requestKey === null) return;
      setResult({ requestKey, key, data });
    },
    [key, requestKey],
  );

  return {
    data: sameKey ? result.data : undefined,
    error: sameKey && !isLoading ? result.error : undefined,
    isLoading,
    reload,
    setData,
  };
}
