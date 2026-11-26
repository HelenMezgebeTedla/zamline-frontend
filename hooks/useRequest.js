"use client";

import { useCallback, useEffect, useState } from "react";

export function useRequest(load) {
  const [state, setState] = useState({
    status: "loading",
    data: null,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    load()
      .then((data) => {
        if (active) setState({ status: "ready", data, error: null });
      })
      .catch((error) => {
        if (active) setState({ status: "failed", data: null, error });
      });
    return () => {
      active = false;
    };
  }, [load, attempt]);

  const reload = useCallback(() => {
    setState((current) => ({ ...current, status: "loading", error: null }));
    setAttempt((count) => count + 1);
  }, []);

  return { ...state, reload };
}
