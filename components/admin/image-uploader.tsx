"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CloudinaryUploadData = {
  secureUrl: string;
  cloudinaryPublicId: string;
  width?: number;
  height?: number;
  format?: string;
};

type Props = {
  value: string;
  onChange: (url: string) => void;
  /** Called with full Cloudinary metadata after upload (null when removed). */
  onCloudinaryData?: (data: CloudinaryUploadData | null) => void;
  /** Resource type forwarded to the upload endpoint. */
  resourceType?: "image" | "video";
  label?: string;
  /** Accepted MIME types for the file input. */
  accept?: string;
};

/**
 * Authenticated image uploader used in admin forms.
 *
 * Posts the file to /api/admin/media/upload (Cloudinary, server-side). If
 * Cloudinary is not configured, the endpoint returns `{ pending: true }` with a
 * message; we surface that and let the admin paste a direct URL instead so the
 * form stays usable in any environment.
 *
 * The `onCloudinaryData` callback carries the full metadata needed to attach
 * a D1 media record after creating/updating a parent entity (product, category).
 */
export function ImageUploader({
  value,
  onChange,
  onCloudinaryData,
  resourceType = "image",
  label = "صورة المنتج",
  accept = "image/jpeg,image/png,image/webp,image/jpg",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const upload = async (file: File) => {
    // Client-side validation
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      setError("حجم الملف كبير جداً (الحد الأقصى 10 ميجا)");
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setError("نوع الملف غير مدعوم. استخدم JPG أو PNG أو WEBP");
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("resourceType", resourceType);
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: form,
      });
      const body = await res.json();

      if (body?.success && body.data?.secureUrl) {
        onChange(body.data.secureUrl);
        if (onCloudinaryData && body.data.cloudinaryPublicId) {
          onCloudinaryData({
            secureUrl: body.data.secureUrl,
            cloudinaryPublicId: body.data.cloudinaryPublicId,
            width: body.data.width,
            height: body.data.height,
            format: body.data.format,
          });
        }
        setSuccess("تم رفع الصورة بنجاح");
        setTimeout(() => setSuccess(null), 2000);
      } else if (body?.data?.pending) {
        // Cloudinary not configured — show the fallback URL input prominently.
        setError(
          "رفع الصور السحابي غير مُفعّل — يمكنك لصق رابط صورة مباشر في الحقل أدناه."
        );
        if (onCloudinaryData) onCloudinaryData(null);
      } else {
        setError(body?.error ?? "تعذر رفع الصورة");
        if (onCloudinaryData) onCloudinaryData(null);
      }
    } catch {
      setError("فشل الاتصال بالخادم — حاول مرة أخرى");
      if (onCloudinaryData) onCloudinaryData(null);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    if (onCloudinaryData) onCloudinaryData(null);
    setSuccess(null);
    setError(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-muted-foreground">
        {label}
      </label>
      <div className="flex items-start gap-3">
        {/* Preview */}
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
          {busy ? (
            <div className="flex size-full items-center justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground/50">
              <ImagePlus className="size-6" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              {value ? "تغيير الصورة" : "رفع صورة"}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-destructive hover:text-destructive"
              >
                <X className="size-3" /> إزالة
              </Button>
            )}
          </div>

          {/* Status messages */}
          {busy && (
            <p className="text-xs text-primary font-medium">
              جاري رفع الصورة...
            </p>
          )}
          {success && !busy && (
            <p className="text-xs text-green-600 font-medium">{success}</p>
          )}

          {/* URL fallback input */}
          <input
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              if (onCloudinaryData) onCloudinaryData(null);
            }}
            placeholder="أو الصق رابط صورة مباشر https://..."
            className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring w-full"
            dir="ltr"
          />
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
