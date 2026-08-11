"use client";

import { useSiteSettings } from "@/components/shared/site-settings";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/ui/SocialIcons";
import type { SocialPlatform } from "@/lib/types";

interface Profile {
  platform: SocialPlatform;
  label: string;
  href: string;
  icon: typeof FacebookIcon;
  handle: string;
}

/**
 * "تابع عروضنا أول بأول" — live links to our social profiles.
 *
 * A simple, always-working section at the end of the page that points
 * visitors to the business' real Facebook / Instagram / TikTok pages (the
 * live source of daily offers). No scraping or API sync — just the profiles.
 */
export function SocialFeed() {
  const settings = useSiteSettings();

  const profiles: Profile[] = [
    {
      platform: "facebook",
      label: "فيسبوك",
      href: settings.social.facebook,
      icon: FacebookIcon,
      handle: "صفحة سوق الجملة",
    },
    {
      platform: "instagram",
      label: "إنستجرام",
      href: settings.social.instagram,
      icon: InstagramIcon,
      handle: "@soukelgomla",
    },
    {
      platform: "tiktok",
      label: "تيك توك",
      href: settings.social.tiktok,
      icon: TikTokIcon,
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
            <WhatsAppIcon className="size-4 text-accent" />
            واتساب
          </a>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {profiles.map((p) => {
            const Icon = p.icon;
            return (
              <a
                key={p.platform}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-border bg-background p-4 transition-shadow hover:shadow-md"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-black text-foreground">
                    {p.label}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {p.handle}
                  </span>
                </span>
                <span className="ms-auto text-xs font-bold text-primary underline-offset-2 group-hover:underline">
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
