"use client";

import { Phone } from "lucide-react";
import { useSiteStructure, useWhatsappHref } from "@/components/shared/site-structure";

export function Footer() {
  const { nav, footer, settings } = useSiteStructure();

  const quickLinks = footer.filter((l) => l.section === "quick_links");
  const contactLinks = footer.filter((l) => l.section === "contact");
  const socialLinks = footer.filter((l) => l.section === "social");

  const logoUrl = settings.logoUrl ?? "";

  return (
    <footer className="border-t border-border-subtle bg-bg-deep">
      <div className="site-section py-10">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt={settings.businessName} className="size-10 rounded-lg object-contain" />
              ) : (
                <span className="text-lg font-black">{settings.businessName}</span>
              )}
              <div>
                <p className="text-lg font-black text-foreground">{settings.businessName}</p>
              </div>
            </div>
            {settings.address && (
              <p className="mt-3 text-sm leading-7 text-text-secondary">{settings.address}</p>
            )}
            <div className="mt-4 flex flex-col gap-2 text-sm">
              {settings.phonePrimary && (
                <a href={`tel:${settings.phonePrimary}`} className="flex items-center gap-2 text-text-secondary transition-colors hover:text-brand-green">
                  <Phone className="size-4 text-brand-green" />
                  <span dir="ltr">{settings.phonePrimary}</span>
                </a>
              )}
              {settings.phoneSecondary && (
                <a href={`tel:${settings.phoneSecondary}`} className="flex items-center gap-2 text-text-secondary transition-colors hover:text-brand-green">
                  <Phone className="size-4 text-brand-green" />
                  <span dir="ltr">{settings.phoneSecondary}</span>
                </a>
              )}
            </div>
          </div>

          {/* Links */}
          <nav aria-label="روابط مفيدة">
            <p className="mb-3 text-sm font-black">روابط مفيدة</p>
            <ul className="flex flex-col gap-2">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <a href={link.url} className="text-sm text-text-secondary transition-colors hover:text-brand-green">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Social / Contact */}
          <div>
            <p className="mb-3 text-sm font-black">التواصل والسوشيال ميديا</p>
            <ul className="flex flex-col gap-2 text-sm">
              {contactLinks.map((link) => (
                <li key={link.id}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-text-secondary transition-colors hover:text-brand-green">
                    {link.label}
                  </a>
                </li>
              ))}
              {socialLinks.map((link) => (
                <li key={link.id}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-text-secondary transition-colors hover:text-brand-green">
                    {link.label}
                  </a>
                </li>
              ))}
              {settings.whatsappNumber && (
                <li>
                  <a href={useWhatsappHref()} target="_blank" rel="noopener noreferrer" className="text-text-secondary transition-colors hover:text-brand-green">
                    واتساب
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-border-subtle pt-5 text-xs text-text-muted md:flex-row">
          <p>© {new Date().getFullYear()} {settings.businessName} — جميع الحقوق محفوظة.</p>
          {settings.address && <p>{settings.address}</p>}
        </div>
      </div>
    </footer>
  );
}
