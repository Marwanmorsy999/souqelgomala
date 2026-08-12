"use client";

import { ShieldCheck } from "lucide-react";

export function TrustStrip() {
  return (
    <div className="bg-brand-green/10 border-y border-brand-green/20">
      <div className="site-section mx-auto flex items-center justify-center gap-3 py-3">
        <ShieldCheck className="size-5 text-brand-green" />
        <p className="text-sm font-bold text-brand-green-dark sm:text-base">
          معتمدين لسلامة الغذاء - شهادة الأيزو ٢٢٠٠٠
        </p>
      </div>
    </div>
  );
}
