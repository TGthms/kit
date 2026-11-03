"use client";
import { useEffect } from "react";
import type { FileItem } from "@/components/shared/file-dropzone";
import { takeHandoff, type ImageTarget } from "./handoff";
export function useHandoff(
  target: ImageTarget,
  onReceive: (files: FileItem[]) => void,
) {
  useEffect(() => {
    const files = takeHandoff(target);
    if (files)
      onReceive(files.map((file) => ({ id: crypto.randomUUID(), file })));
  }, [target, onReceive]);
}
