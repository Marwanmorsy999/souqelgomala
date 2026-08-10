"use client";

import { useEffect, useState } from "react";
import { Menu, Phone, Search, ShoppingCart, UserRound } from "lucide-react";
import { logoUrl } from "@/lib/data";
import { useSiteSettings } from "@/components/shared/site-settings";

type Props = {
  cartCount: number;
  onMenu: () => void;
  onSearch: () => void;
  onAccount: () => void;
  onCart: () => void;
};

export function Header({
  cartCount,
  onMenu,
  onSearch,
  onAccount,
  onCart,
}: Props) {
  const settings = useSiteSettings();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 bg-background/95 backdrop-blur transition-shadow ${
        scrolled ? "border-b shadow-sm" : "border-b border-transparent"
      }`}
    >
      <div className="site-section flex h-14 items-center justify-between gap-2">
        {/* Left group */}
        <div className="flex items-center gap-1">
          <button
            onClick={onMenu}
            aria-label="القائمة"
            className="flex size-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted md:hidden"
          >
            <Menu className="size-5" />
          </button>

          {/* Desktop logo */}
          <button
            onClick={onMenu}
            className="hidden shrink-0 items-center gap-2 md:flex"
            aria-label="سوق الجملة — الرئيسية"
          >
            <img
              src={logoUrl}
              alt="سوق الجملة"
              className="size-9 rounded-lg object-contain"
            />
            <span className="hidden text-lg font-black lg:block">
              {settings.name}
            </span>
          </button>
        </div>

        {/* Centered mobile logo */}
        <button
          onClick={onMenu}
          className="absolute left-1/2 -translate-x-1/2 md:hidden"
          aria-label="سوق الجملة — الرئيسية"
        >
          <img
            src={logoUrl}
            alt="سوق الجملة"
            className="size-10 rounded-lg object-contain"
          />
        </button>

        {/* Desktop search */}
        <div className="hidden flex-1 px-6 md:block">
          <button
            onClick={onSearch}
            className="flex h-10 w-full items-center gap-2 rounded-xl border border-input bg-muted/60 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
            aria-label="ابحث عن منتج"
          >
            <Search className="size-4" />
            <span>ابحث عن منتج...</span>
          </button>
        </div>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="التنقل الرئيسي"
        >
          {[
            ["الرئيسية", "#home"],
            ["الأقسام", "#categories"],
            ["العروض", "#offers"],
            ["المنتجات", "#products"],
            ["تواصل معنا", "#contact"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                label === "العروض"
                  ? "font-black text-primary hover:bg-primary/10"
                  : "text-foreground hover:bg-muted hover:text-primary"
              }`}
            >
              {label === "العروض" ? "🔥 عروض النهارده" : label}
            </a>
          ))}
        </nav>

        {/* Right group */}
        <div className="flex items-center gap-1">
          {/* Desktop phone CTA */}
          <a
            href={`tel:${settings.phoneMain}`}
            className="hidden h-10 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 lg:flex"
          >
            <Phone className="size-4" />
            <span dir="ltr">{settings.phoneMain}</span>
          </a>

          {/* Search (mobile) */}
          <button
            onClick={onSearch}
            aria-label="بحث"
            className="flex size-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted md:hidden"
          >
            <Search className="size-5" />
          </button>

          {/* Cart */}
          <button
            onClick={onCart}
            aria-label={`السلة (${cartCount} منتج)`}
            className="relative flex size-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted"
          >
            <ShoppingCart className="size-5" />
            {cartCount > 0 && (
              <span className="absolute -left-0.5 -top-0.5 flex size-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
