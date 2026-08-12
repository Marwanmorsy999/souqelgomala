"use client";

import { Phone } from "lucide-react";
import { useSiteStructure } from "@/components/shared/site-structure";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from "@/components/ui/SocialIcons";

export function Footer() {
  const { footer, settings } = useSiteStructure();

  const quickLinks = footer.filter((l) => l.section === "quick_links");
  const logoUrl = settings.logoUrl ?? "";

  // Single canonical set of social profiles rendered as branded icon cards.
  // The old plain-text "التواصل والسوشيال ميديا" list repeated these same 4
  // platforms (واتساب/فيسبوك/انستجرام/تيك توك), so it has been removed to
  // avoid listing the same networks twice on one page.
  const socials = [
    {
      key: "facebook",
      label: "فيسبوك",
      href: settings.facebookUrl ?? "https://www.facebook.com/share/1FZUWgbRkR/",
      icon: FacebookIcon,
      color: "#1877F2",
      handle: "سوق الجملة",
    },
    {
      key: "instagram",
      label: "إنستجرام",
      href: settings.instagramUrl ?? "https://www.instagram.com/soukelgomla",
      icon: InstagramIcon,
      color: "#E4405F",
      handle: "@soukelgomla",
    },
    {
      key: "tiktok",
      label: "تيك توك",
      href: settings.tiktokUrl ?? "https://www.tiktok.com/@soukelgomla",
      icon: TikTokIcon,
      color: "#000000",
      handle: "@soukelgomla",
    },
  ];

  return (
    <footer className="border-t border-border-subtle bg-bg-deep">
      <div className="site-section py-10">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
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
            <div className="mt-4 rounded-lg border border-brand-green/20 bg-brand-green/5 p-3 text-xs leading-6 text-text-secondary">
              <p className="font-bold text-brand-green-light">الطلبات تتم عن طريق الموقع</p>
              <p className="mt-1">للاستفسارات والشكاوى فقط، كلمنا على التليفون أو واتساب.</p>
              <p className="mt-1 text-text-muted">مواعيد العمل: يومياً من 9 صباحاً حتى 11 مساءً</p>
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
        </div>

        {/* Follow us — merged INTO the footer as its final section so the page
            ends in ONE continuous footer block instead of two disconnected ones. */}
        <div className="mt-10 rounded-2xl border border-border-default bg-bg-elevated/60 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black sm:text-2xl">تابع عروضنا أول بأول على صفحاتنا</h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-text-secondary">
                بننزل عروض وفرص كل يوم على فيسبوك وإنستجرام وتيك توك — تابعنا عشان
                أول عرض توصلك.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {socials.map((p) => {
              const Icon = p.icon;
              return (
                <a
                  key={p.key}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl border border-border-default bg-bg-elevated/60 p-4 transition-all hover:border-brand-green/50 hover:bg-bg-elevated"
                >
                  <span
                    className="flex size-12 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: p.color }}
                  >
                    <Icon className="size-6" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-black text-foreground">
                      {p.label}
                    </span>
                    <span className="truncate text-xs text-text-muted">
                      {p.handle}
                    </span>
                  </span>
                  <span
                    className="ms-auto text-xs font-bold underline-offset-2 group-hover:underline"
                    style={{ color: p.color }}
                  >
                    افتح
                  </span>
                </a>
              );
            })}
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
