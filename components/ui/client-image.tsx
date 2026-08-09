"use client";

import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Container classes (controls box, skeleton, object-fit). */
  wrapperClassName?: string;
  eager?: boolean;
  /** Optional badge / overlay rendered inside the wrapper (above the image). */
  children?: React.ReactNode;
};

/**
 * Storefront image with a loading skeleton and a graceful error fallback.
 *
 * The container keeps its box (e.g. aspect-square) while the image loads, then
 * fades the real image in. If the image fails, a neutral placeholder is shown
 * instead of a broken-image glyph. Containment is controlled by `imgClassName`
 * so callers can choose `object-cover` (cards) vs `object-contain` (category icons).
 */
export function ClientImage({
  src,
  alt,
  className,
  imgClassName = "size-full object-cover",
  wrapperClassName,
  eager = false,
  children,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div
      className={`relative overflow-hidden bg-muted ${className ?? ""} ${
        wrapperClassName ?? ""
      }`}
    >
      {!loaded && !errored && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted to-muted-foreground/10" />
      )}

      {errored ? (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
          <svg viewBox="0 0 24 24" className="size-8 text-muted-foreground/50" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="m3 15 5-5 4 4 3-3 6 6" />
            <circle cx="8.5" cy="8.5" r="1.5" />
          </svg>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`${imgClassName} transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {children}
    </div>
  );
}
