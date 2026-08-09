import { MapPin, Phone } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/ui/SocialIcons";
import { logoUrl } from "@/lib/data";
import { SITE, telAlt, telMain, waLink } from "@/lib/site";

export function Footer() {
  const links = [
    ["الرئيسية", "home"],
    ["الأقسام", "categories"],
    ["المنتجات", "products"],
    ["العروض", "offers"],
    ["من نحن", "home"],
    ["تواصل معنا", "contact"],
    ["الأسئلة الشائعة", "faq"],
  ] as const;

  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-[1.3fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <img
                src={logoUrl}
                alt="سوق الجملة"
                className="size-12 rounded-xl object-contain"
              />
              <div>
                <p className="text-lg font-black">{SITE.name}</p>
                <p dir="ltr" className="text-xs text-muted-foreground">
                  {SITE.nameEn}
                </p>
              </div>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-7 text-muted-foreground">
              {SITE.description}
            </p>
            <div className="mt-4 flex gap-2">
              {[
                {
                  icon: FacebookIcon,
                  label: "فيسبوك",
                  href: SITE.social.facebook,
                },
                {
                  icon: InstagramIcon,
                  label: "إنستجرام",
                  href: SITE.social.instagram,
                },
                {
                  icon: TikTokIcon,
                  label: "تيك توك",
                  href: SITE.social.tiktok,
                },
                { icon: WhatsAppIcon, label: "واتساب", href: waLink },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Useful links */}
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

          {/* Contact */}
          <div>
            <p className="mb-3 text-sm font-black">تواصل معنا</p>
            <ul className="flex flex-col gap-3 text-sm">
              <li>
                <a
                  href={telMain}
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Phone className="size-4 text-primary" />
                  <span dir="ltr">{SITE.phoneMain}</span>
                </a>
              </li>
              <li>
                <a
                  href={telAlt}
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Phone className="size-4 text-primary" />
                  <span dir="ltr">{SITE.phoneAlt}</span>
                </a>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  {SITE.location}
                  <br />
                  شارع جمال عبد الناصر — خلف مسجد آل عطا الله
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t pt-5 text-xs text-muted-foreground md:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.name} — جميع الحقوق محفوظة.
          </p>
          <p>{SITE.description}</p>
        </div>
      </div>
    </footer>
  );
}
