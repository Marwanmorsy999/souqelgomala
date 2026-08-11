"use client";

import { useSiteSettings } from "@/components/shared/site-settings";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/ui/SocialIcons";

interface Profile {
  key: string;
  label: string;
  href: string;
  icon: typeof FacebookIcon;
  /** Official brand color used for the logo + accent. */
  color: string;
  handle: string;
}

/**
 * "تابع عروضنا أول بأول" — live links to our real social profiles.
 *
 * Three side-by-side panels (Facebook / Instagram / TikTok), each using the
 * official brand logo and linking straight to the live profile — the real
 * source of daily offers. Plus a WhatsApp button. No fabricated icons, no API
 * scraping: these are the actual platform pages.
 */
export function SocialFeed() {
  const settings = useSiteSettings();

  const profiles: Profile[] = [
    {
      key: "facebook",
      label: "فيسبوك",
      href: settings.social.facebook,
      icon: FacebookIcon,
      color: "#1877F2",
      handle: "سوق الجملة",
    },
    {
      key: "instagram",
      label: "إنستجرام",
      href: settings.social.instagram,
      icon: InstagramIcon,
      color: "#E4405F",
      handle: "@soukelgomla",
    },
    {
      key: "tiktok",
      label: "تيك توك",
      href: settings.social.tiktok,
      icon: TikTokIcon,
      color: "#000000",
      handle: "@soukelgomla",
    },
  ];

  return (
    <section id="social" className="site-section scroll-mt-20">
      <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black sm:text-2xl">
              تابع عروضنا أول بأول على صفحاتنا
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
              بننزل عروض وفرص كل يوم على فيسبوك وإنستجرام وتيك توك — تابعنا عشان
              أول عرض توصلك.
            </p>
          </div>
          <a
            href={`https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-muted"
          >
            <WhatsAppIcon className="size-4" style={{ color: "#25D366" }} />
            واتساب
          </a>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {profiles.map((p) => {
            const Icon = p.icon;
            return (
              <a
                key={p.key}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-border bg-background p-4 transition-shadow hover:shadow-md"
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
                  <span className="truncate text-xs text-muted-foreground">
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
    </section>
  );
}
