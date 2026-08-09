"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { logoUrl } from "@/lib/data";
import { getProducts } from "@/lib/services/catalog";

import { Header } from "@/components/home/Header";
import { HamburgerMenu } from "@/components/home/HamburgerMenu";
import { SearchOverlay } from "@/components/home/SearchOverlay";
import { WhatsAppButton } from "@/components/home/WhatsAppButton";
import { CategoryProducts } from "@/components/home/CategoryProducts";
import { Hero } from "@/components/home/sections/Hero";
import { PromoBanner } from "@/components/home/sections/PromoBanner";
import { DailyOffers } from "@/components/home/sections/DailyOffers";
import { Categories } from "@/components/home/sections/Categories";
import { LatestProducts } from "@/components/home/sections/LatestProducts";
import { SocialFeed } from "@/components/home/sections/SocialFeed";
import { Footer } from "@/components/home/sections/Footer";

import { ProductDetail } from "@/components/home/ProductDetail";
import { CartView } from "@/components/cart/CartView";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { OrdersView } from "@/components/orders/OrdersView";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { BottomNav } from "@/components/shared/BottomNav";

import { useStore } from "@/lib/store";
import type { Product, View } from "@/lib/types";

export default function Page() {
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>("home");
  const [selected, setSelected] = useState<Product | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [category, setCategory] = useState("");

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
    return () => {
      active = false;
    };
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, item) => {
    const product = productMap[item.id];
    return (
      s +
      (product
        ? (isWholesale ? product.wholesale : product.retail) * item.quantity
        : 0)
    );
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
    <main className="min-h-screen bg-background pb-20" dir="rtl">
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
            <div className="flex flex-col gap-10 pb-4 pt-3">
              <Hero onOffers={() => goToAnchor("offers")} />
              <DailyOffers onOpen={setSelected} />
              <Categories onSelect={handleCategory} />
              <LatestProducts onOpen={setSelected} />
              <SocialFeed />
              <PromoBanner />
              <Footer />
            </div>
          )}

          {view === "category" && (
            <CategoryProducts
              category={category}
              onBack={() => setView("home")}
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
          else if (target.view === "account") setAuthOpen(true);
          else setView("home");
        }}
      />

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectCategory={handleCategory}
        onSelectProduct={setSelected}
      />

      <AuthDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </main>
  );
}
