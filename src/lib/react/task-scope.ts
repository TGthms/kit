"use client";

import { useEffect, useState } from "react";

/** Async reads and exports belong to the source that started them. Changing
 * that source or unmounting invalidates every outstanding completion. */
export function useTaskScope() {
  const [scope] = useState(() => {
    let generation = 0;
    const capture = () => {
      const own = generation;
      return () => own === generation;
    };
    return {
      capture,
      invalidate: () => { generation += 1; },
      begin: () => { generation += 1; return capture(); },
    };
  });
  useEffect(() => () => scope.invalidate(), [scope]);
  return scope;
}
