"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SITE_SETTINGS,
  normalizeSiteSettings,
  type SiteSettings,
} from "@/lib/site-settings";

/**
 * SiteSettingsProvider
 *
 * Loads the admin-managed business info (`GET /api/site`, D1-backed with
 * lib/site.ts defaults) once and shares it with every storefront component
 * via `useSiteSettings()`. While the fetch is in flight (or on failure) the
 * DEFAULT settings are used, so the storefront never renders empty content.
 */
const SiteSettingsContext = createContext<SiteSettings>(DEFAULT_SITE_SETTINGS);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    let active = true;
    fetch("/api/site", { cache: "no-store" })
      .then((res) => res.json())
      .then((body) => {
        if (active && body?.success && body.data) {
          setSettings(normalizeSiteSettings(body.data));
        }
      })
      .catch(() => {
        /* keep defaults — business info always renders */
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

/** Read the current site settings (defaults until the fetch resolves). */
export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext);
}

/** Derived WhatsApp deep-link using the admin-managed number. */
export function useWhatsappLink(): string {
  const { whatsapp } = useSiteSettings();
  const digits = whatsapp.replace(/[^\d]/g, "");
  return `https://wa.me/${digits || DEFAULT_SITE_SETTINGS.whatsapp}`;
}