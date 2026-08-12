"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { logoUrl } from "@/lib/data";
import { getProducts, getDailyOffers } from "@/lib/services/catalog";

import { Header } from "@/components/home/Header";
import { HamburgerMenu } from "@/components/home/HamburgerMenu";
import { SearchOverlay } from "@/components/home/SearchOverlay";
import { WhatsAppButton } from "@/components/home/WhatsAppButton";
import { CategoryProducts } from "@/components/home/CategoryProducts";
import { ShopPage } from "@/components/home/ShopPage";
import { Hero } from "@/components/home/sections/Hero";
import { DealsCountdown } from "@/components/home/sections/DealsCountdown";
import { PromoBanner } from "@/components/home/sections/PromoBanner";
import { DailyOffers } from "@/components/home/sections/DailyOffers";
import { LatestProducts } from "@/components/home/sections/LatestProducts";
import { SocialFeed } from "@/components/home/sections/SocialFeed";
import { Footer } from "@/components/home/sections/Footer";
import { TrustStrip } from "@/components/home/sections/TrustStrip";
import { VisitUs } from "@/components/home/sections/VisitUs";
import { WhyUs } from "@/components/home/sections/WhyUs";
import { CategoryGrid } from "@/components/home/sections/CategoryGrid";

import { ProductDetail } from "@/components/home/ProductDetail";
import { CartView } from "@/components/cart/CartView";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { OrdersView } from "@/components/orders/OrdersView";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { BottomNav } from "@/components/shared/BottomNav";

import { useStore } from "@/lib/store";
import type { Product, View, Offer } from "@/lib/types";
import { useSiteStructure } from "@/components/shared/site-structure";

export default function Page() {
  const { homepage } = useSiteStructure();
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>("home");
  const [selected, setSelected] = useState<Product | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [shopSearch, setShopSearch] = useState<string | undefined>(undefined);

  const cart = useStore((s) => s.cart);
  const isWholesale = useStore((s) => s.isWholesale);
  const setWholesale = useStore((s) => s.setWholesale);
  const increment = useStore((s) => s.increment);
  const decrement = useStore((s) => s.decrement);
  const remove = useStore((s) => s.remove);
  const clear = useStore((s) => s.clear);

  // Brand splash (keeps the existing brand moment, short & light).
  useEffect(() => {
    const t = window.setTimeout(() => setLoaded(true), 700);
    return () => window.clearTimeout(t);
  }, []);

const [productMap, setProductMap] = useState<Record<string, Product>>({});
const [offerMap, setOfferMap] = useState<Record<string, Offer>>({});

  // Load the catalog once so cart totals can be computed client-side while
  // still reading from D1 (via the public catalog API) as the source of truth.
  useEffect(() => {
    let active = true;
    getProducts()
      .then((list) => {
        if (!active) return;
        const map: Record<string, Product> = {};
        for (const p of list) map[p.id] = p;
        setProductMap(map);
      })
      .catch(() => {
        /* cart totals default to 0 if the catalog is unavailable */
      });

    getDailyOffers()
      .then((payload) => {
        if (!active) return;
        const map: Record<string, Offer> = {};
        for (const o of payload.offers) {
          if (o.discountType === 'bundle') map[o.id] = o;
        }
        setOfferMap(map);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, item) => {
    const product = productMap[item.id];
    if (product) {
      return s + (isWholesale ? product.wholesale : product.retail) * item.quantity;
    }
    const offer = offerMap[item.id];
    if (offer) {
      const bundlePrice = offer.value ?? offer.products.reduce((acc, p) => acc + p.retail, 0);
      return s + bundlePrice * item.quantity;
    }
    return s;
  }, 0);

  const goToAnchor = (anchor: string) => {
    setView("home");
    window.scrollTo({ top: 0, behavior: "auto" });
    setTimeout(
      () =>
        document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" }),
      120,
    );
  };

  const handleCategory = (name: string) => {
    if (name === "العروض") {
      goToAnchor("offers");
      return;
    }
    setCategory(name);
    setView("category");
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const handleAuthSuccess = (type: "customer" | "wholesale") => {
    setWholesale(type === "wholesale");
  };

  const handleCheckoutSuccess = () => {
    clear();
    setView("orders");
  };

  // Splash screen (brand first)
  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <img
            src={logoUrl}
            alt="سوق الجملة"
            className="size-40 rounded-3xl object-contain"
          />
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <span className="size-2 animate-bounce rounded-full bg-primary" />
            <span className="size-2 animate-bounce rounded-full bg-accent [animation-delay:120ms]" />
            <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:240ms]" />
          </div>
        </motion.div>
      </main>
    );
  }

  // Product detail (full screen)
  if (selected) {
    return (
      <>
        <ProductDetail
          product={selected}
          isWholesale={isWholesale}
          onBack={() => setSelected(null)}
          onSelect={setSelected}
        />
        <WhatsAppButton />
      </>
    );
  }

  // Checkout (full screen)
  if (view === "checkout") {
    return (
      <CheckoutView
        cart={cart}
        total={cartTotal}
        onBack={() => setView("cart")}
        onSuccess={handleCheckoutSuccess}
      />
    );
  }
  return (
    <main className="min-h-screen overflow-x-hidden bg-background pb-20" dir="rtl">
      {view === "home" && (
        <Header
          cartCount={cartCount}
          onMenu={() => setMenuOpen(true)}
          onSearch={() => setSearchOpen(true)}
          onAccount={() => setAuthOpen(true)}
          onCart={() => setView("cart")}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={view === "category" ? `category-${category}` : view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          {view === "home" && (
            <div className="flex flex-col gap-6 md:gap-10 pb-4 pt-3">
              {homepage
                .filter((s) => s.visible)
                .map((s) => {
                  switch (s.section_key) {
                    case "hero":
                      return (
                        <div key="hero-group">
                          <Hero onOffers={() => goToAnchor("offers")} />
                          <CategoryGrid onCategorySelect={handleCategory} />
                          <TrustStrip />
                          <VisitUs />
                        </div>
                      );
                    case "deals_strip":
                      return <DealsCountdown key="deals" />
                    case "products":
                      return <LatestProducts key="products" onOpen={setSelected} />
                    default:
                      return null
                  }
                })}
              <DailyOffers onOpen={setSelected} />
              <PromoBanner />
              <WhyUs />
              <Footer />
              <SocialFeed />
            </div>
          )}

          {view === "category" && (
            <CategoryProducts
              category={category}
              onBack={() => setView("home")}
              onOpen={setSelected}
            />
          )}

          {view === "shop" && (
            <ShopPage
              search={shopSearch}
              onOpen={setSelected}
            />
          )}

          {view === "cart" && (
            <CartView
              cart={cart}
              total={cartTotal}
              increment={increment}
              decrement={decrement}
              remove={remove}
              clear={clear}
              onBack={() => setView("home")}
              onCheckout={() => setView("checkout")}
            />
          )}

          {view === "orders" && <OrdersView onBack={() => setView("home")} />}
        </motion.div>
      </AnimatePresence>

      <BottomNav
        view={view}
        cartCount={cartCount}
        onNavigate={setView}
        onAuthOpen={() => setAuthOpen(true)}
        onSearchOpen={() => setSearchOpen(true)}
        onCategoriesOpen={() => setMenuOpen(true)}
      />

      <WhatsAppButton />

      <HamburgerMenu
        open={menuOpen}
        cartCount={cartCount}
        onClose={() => setMenuOpen(false)}
        onNavigate={(target) => {
          if (target.view === "category" && target.category)
            handleCategory(target.category);
          else if (target.view === "cart") setView("cart");
          else if (target.view === "shop") {
            setShopSearch(undefined);
            setView("shop");
          } else if (target.view === "account") setAuthOpen(true);
          else setView("home");
        }}
      />

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectCategory={handleCategory}
        onSelectProduct={(p) => {
          setShopSearch(p.name);
          setView("shop");
        }}
      />

      <AuthDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </main>
  );
}
