import { useCallback, useEffect, useRef } from "react";

/** setTimeout sécurisé : toutes les minuteries sont annulées au démontage. */
export function useTimers() {
  const ids = useRef<Set<number>>(new Set());

  useEffect(() => {
    const set = ids.current;
    return () => {
      set.forEach((id) => window.clearTimeout(id));
      set.clear();
    };
  }, []);

  return useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      ids.current.delete(id);
      fn();
    }, ms);
    ids.current.add(id);
    return id;
  }, []);
}
