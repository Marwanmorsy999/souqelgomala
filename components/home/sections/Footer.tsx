"use client";

import { Phone } from "lucide-react";
import { logoUrl } from "@/lib/data";
import { useSiteSettings } from "@/components/shared/site-settings";

export function Footer() {
  const settings = useSiteSettings();
  const links = [
    ["الرئيسية", "home"],
    ["الأقسام", "categories"],
    ["المنتجات", "products"],
    ["العروض", "offers"],
    ["تواصل معنا", "contact"],
  ] as const;

  return (
    <footer className="border-t bg-muted/40">
      <div className="site-section py-10">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <img
                src={logoUrl}
                alt={settings.name}
                className="size-10 rounded-lg object-contain"
              />
              <div>
                <p className="text-lg font-black">{settings.name}</p>
                <p dir="ltr" className="text-xs text-muted-foreground">
                  {settings.nameEn}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {settings.location}
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <a
                href={`tel:${settings.phoneMain}`}
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <Phone className="size-4 text-primary" />
                <span dir="ltr">{settings.phoneMain}</span>
              </a>
              <a
                href={`tel:${settings.phoneAlt}`}
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <Phone className="size-4 text-primary" />
                <span dir="ltr">{settings.phoneAlt}</span>
              </a>
            </div>
          </div>

          {/* Links */}
          <nav aria-label="روابط مفيدة">
            <p className="mb-3 text-sm font-black">روابط مفيدة</p>
            <ul className="flex flex-col gap-2">
              {links.map(([label, href]) => (
                <li key={href}>
                  <a
                    href={`#${href}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Social */}
          <div>
            <p className="mb-3 text-sm font-black">السوشيال ميديا</p>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <a
                  href={settings.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  فيسبوك
                </a>
              </li>
              <li>
                <a
                  href={settings.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  إنستجرام
                </a>
              </li>
              <li>
                <a
                  href={settings.social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  تيك توك
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  واتساب
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t pt-5 text-xs text-muted-foreground md:flex-row">
          <p>
            © {new Date().getFullYear()} {settings.name} — جميع الحقوق محفوظة.
          </p>
          <p>{settings.location}</p>
        </div>
      </div>
    </footer>
  );
}
