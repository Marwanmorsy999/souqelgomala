"use client";

import { useState } from "react";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from "@/components/ui/SocialIcons";
import { SITE } from "@/lib/site";

export function NewsletterSocial() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const socials = [
    { label: "فيسبوك", href: SITE.social.facebook, icon: FacebookIcon },
    { label: "إنستجرام", href: SITE.social.instagram, icon: InstagramIcon },
    { label: "تيك توك", href: SITE.social.tiktok, icon: TikTokIcon },
  ];

  return (
    <section id="contact" className="mx-auto max-w-6xl scroll-mt-20 px-4">
      <div className="overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-2xl font-black">كن أول من يعرف العروض</h2>
            <p className="mt-2 text-sm text-primary-foreground/80">
              سيب بياناتك ووصلك أخبار العروض والمنتجات الجديدة في سوق الجملة.
            </p>

            {done ? (
              <p className="mt-4 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold">
                شكراً ليك! هنوصلك أخبار العروض الجديدة. 🎉
              </p>
            ) : (
              <form
                className="mt-4 flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.trim()) setDone(true);
                }}
              >
                <label htmlFor="newsletter-email" className="sr-only">
                  البريد الإلكتروني
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  className="h-12 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 text-primary-foreground placeholder:text-primary-foreground/60 outline-none focus-visible:ring-3 focus-visible:ring-white/40"
                />
                <button
                  type="submit"
                  className="h-12 rounded-xl bg-accent px-6 font-black text-accent-foreground transition-transform active:scale-95"
                >
                  اشترك
                </button>
              </form>
            )}
          </div>

          <div>
            <p className="mb-3 text-sm font-bold">تابعنا على السوشيال ميديا</p>
            <div className="flex flex-wrap gap-2.5">
              {socials.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-12 min-w-12 items-center justify-center gap-2 rounded-xl bg-white/10 px-3 text-sm font-bold backdrop-blur transition-colors hover:bg-white/20"
                >
                  <Icon className="size-5 text-accent" />
                  <span className="hidden sm:inline">{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
