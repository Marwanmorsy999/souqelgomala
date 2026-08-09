"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  value: string;
  onChange: (url: string) => void;
  /** Resource type forwarded to the upload endpoint. */
  resourceType?: "image" | "video";
  label?: string;
};

/**
 * Authenticated image uploader used in admin forms.
 *
 * Posts the file to /api/admin/media/upload (Cloudinary, server-side). If
 * Cloudinary is not configured, the endpoint returns `{ pending: true }` with a
 * message; we surface that and let the admin paste a direct URL instead so the
 * form stays usable in any environment.
 */
export function ImageUploader({ value, onChange, resourceType = "image", label = "صورة المنتج" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("resourceType", resourceType);
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: form });
      const body = await res.json();
      if (body?.success && body.data?.secureUrl) {
        onChange(body.data.secureUrl);
      } else if (body?.data?.pending) {
        setError("رفع الصور السحابي غير مهيأ — الصق رابط صورة مباشر.");
      } else {
        setError(body?.error ?? "تعذر رفع الصورة");
      }
    } catch {
      setError("تعذر رفع الصورة");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative size-20 overflow-hidden rounded-xl border border-border bg-muted">
          {value ? (
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground/50">
              <ImagePlus className="size-6" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {value ? "تغيير الصورة" : "رفع صورة"}
          </Button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="flex items-center gap-1 text-xs text-destructive"
            >
              <X className="size-3" /> إزالة
            </button>
          )}
        </div>
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://… (رابط مباشر)"
        className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
