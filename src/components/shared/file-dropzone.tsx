"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface FileItem {
  id: string;
  file: File;
}

interface Props {
  accept?: string;
  multiple?: boolean;
  files: FileItem[];
  onChange: (files: FileItem[]) => void;
  reorder?: boolean;
}

export function FileDropzone({
  accept,
  multiple = true,
  files,
  onChange,
  reorder = false,
}: Props) {
  const t = useTranslations("common");
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const dragId = useRef<string | null>(null);

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      const arr = Array.from(list).map((file) => ({
        id: crypto.randomUUID(),
        file,
      }));
      onChange(multiple ? [...files, ...arr] : arr.slice(0, 1));
    },
    [files, multiple, onChange]
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (e.clipboardData.files?.length) {
        e.preventDefault();
        addFiles(e.clipboardData.files);
      }
    },
    [addFiles]
  );

  return (
    <div className="space-y-3" onPaste={onPaste}>
      <div
        className={cn(
          "pressable-soft flex min-h-[9.5rem] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center sm:min-h-[11rem] sm:py-10",
          "transition-[border-color,background-color,transform,box-shadow] duration-150 ease-out",
          drag
            ? "border-primary bg-accent/50 surface-float"
            : "border-border bg-card hover:bg-accent/30 hover:border-primary/35"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <Upload className="mb-3 h-8 w-8 text-primary" />
        <p className="text-sm font-medium">{t("dropFiles")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("orBrowse")}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t("pasteSupported")}</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((item, index) => (
            <li
              key={item.id}
              draggable={reorder}
              onDragStart={() => {
                dragId.current = item.id;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (!reorder || !dragId.current || dragId.current === item.id) return;
                const from = files.findIndex((f) => f.id === dragId.current);
                const to = index;
                if (from < 0) return;
                const next = [...files];
                const [moved] = next.splice(from, 1);
                next.splice(to, 0, moved);
                onChange(next);
                dragId.current = null;
              }}
              className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5 text-sm sm:gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {reorder ? `${index + 1}. ` : ""}
                  {item.file.name}
                </p>
                <p className="text-xs text-muted-foreground">{formatBytes(item.file.size)}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 shrink-0 px-3"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(files.filter((f) => f.id !== item.id));
                }}
              >
                {t("remove")}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-xs text-muted-foreground">{t("noFiles")}</p>
      )}
    </div>
  );
}
