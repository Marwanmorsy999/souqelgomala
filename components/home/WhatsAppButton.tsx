"use client";

import { useEffect, useState } from "react";
import { useWhatsappLink } from "@/components/shared/site-settings";

export function WhatsAppButton() {
  const waLink = useWhatsappLink();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setHidden(document.body.classList.contains("menu-drawer-open"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <a
      href={waLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل معنا عبر واتساب"
      className={`whatsapp-fab fixed bottom-[88px] sm:bottom-24 md:bottom-6 left-6 z-[99] flex size-12 md:size-14 items-center justify-center rounded-full text-white shadow-lg shadow-black/20 transition-all duration-300 hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring ${
        hidden ? "pointer-events-none translate-y-4 opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: "#25D366" }}
    >
      <svg viewBox="0 0 32 32" className="size-6 md:size-7 fill-white" aria-hidden="true">
        <path d="M16 3C9.37 3 4 8.37 4 15c0 2.11.55 4.17 1.6 5.99L4 24l3.24-1.53A11.9 11.9 0 0 0 16 27c6.63 0 12-5.37 12-12S22.63 3 16 3Zm5.75 16.38c-.22.62-1.28 1.17-1.85 1.24-.49.06-1.12.1-1.8-.11a15.4 15.4 0 0 1-1.65-.62c-2.91-1.25-4.8-4.18-4.95-4.37-.14-.2-1.18-1.57-1.18-3s.75-2.12 1.02-2.41c.27-.29.58-.36.78-.36l.56.01c.18.01.42-.07.66.5.23.56.8 1.9.87 2.05.07.14.12.32.02.51-.09.2-.14.32-.28.5l-.43.5c-.14.14-.29.3-.12.58.17.29.74 1.22 1.59 1.98 1.09.98 2.01 1.28 2.3 1.42.28.14.45.12.61-.07.17-.19.71-.82.9-1.1.19-.29.37-.24.62-.14.25.1 1.61.76 1.88.9.28.14.46.2.53.32.07.11.07.66-.15 1.27Z" />
      </svg>
    </a>
  );
}
