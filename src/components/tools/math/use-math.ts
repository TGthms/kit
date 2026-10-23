"use client";
import { useEffect, useRef, useState } from "react";
import {
  MathClient,
  type MathReply,
  type MathRequest,
} from "@/lib/math/client";

export function useMath<T>() {
  const client = useRef<MathClient | null>(null);
  const sequence = useRef(0);
  const [state, setState] = useState<{
    loading: boolean;
    reply: MathReply<T> | null;
  }>({ loading: false, reply: null });
  useEffect(
    () => () => {
      sequence.current++;
      client.current?.dispose();
    },
    [],
  );
  const run = async (request: MathRequest) => {
    const id = ++sequence.current;
    client.current ??= new MathClient();
    setState({ loading: true, reply: null });
    const reply = await client.current.run<T>(request);
    if (sequence.current === id) setState({ loading: false, reply });
    return reply;
  };
  const clear = () => {
    sequence.current++;
    client.current?.cancel();
    setState({ loading: false, reply: null });
  };
  return { ...state, run, clear };
}
