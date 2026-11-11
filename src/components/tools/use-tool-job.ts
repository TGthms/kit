"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ResultFile } from "@/components/workspace/result-files";

/** A processing result belongs to one immutable input snapshot. Source changes,
 * cancellation and unmount invalidate every completion, including ZIP creation. */
export function useToolJob(inputs?: readonly unknown[]) {
  const controller = useRef<AbortController | null>(null);
  const previous = useRef(inputs);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ResultFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  useLayoutEffect(() => {
    if (inputs && previous.current && inputs.some((input, i) => input !== previous.current?.[i])) {
      controller.current?.abort();
      controller.current = null;
      setLoading(false); setResults([]); setError(null); setProgress(0);
    }
    previous.current = inputs;
  }, [inputs]);
  useEffect(() => () => { controller.current?.abort(); controller.current = null; }, []);
  const start = () => {
    controller.current?.abort();
    const ac = new AbortController();
    controller.current = ac;
    setLoading(true); setProgress(0); setResults([]); setError(null);
    return ac;
  };
  const owns = (ac: AbortController) => controller.current === ac && !ac.signal.aborted;
  const report = (ac: AbortController, progress: number) => { if (owns(ac) && Number.isFinite(progress)) setProgress(Math.max(0, Math.min(100, progress))); };
  const stop = (ac?: AbortController) => {
    if (ac && controller.current !== ac) return;
    setLoading(false); controller.current = null;
  };
  const complete = (ac: AbortController, files: ResultFile[]) => {
    if (!owns(ac)) return false;
    setResults(files); setProgress(100);
    return true;
  };
  const fail = (ac: AbortController, reason: unknown) => {
    if (!owns(ac)) return false;
    setError(reason instanceof Error ? reason.message : String(reason));
    return true;
  };
  const cancel = () => { controller.current?.abort(); setLoading(false); };
  return { loading, progress, setProgress, report, start, stop, cancel, complete, fail, results, error };
}
