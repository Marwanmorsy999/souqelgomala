"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { faqs } from "@/lib/site";

export function Faq() {
  const [openId, setOpenId] = useState<string | null>("f1");

  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4">
      <div className="mb-5 text-center">
        <h2 className="text-xl font-black sm:text-2xl">الأسئلة الشائعة</h2>
        <p className="text-sm text-muted-foreground">
          كل اللي محتاج تعرفه عن سوق الجملة
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {faqs.map((item) => {
          const open = openId === item.id;
          return (
            <div
              key={item.id}
              className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
            >
              <button
                onClick={() => setOpenId(open ? null : item.id)}
                aria-expanded={open}
                aria-controls={`faq-panel-${item.id}`}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-right text-sm font-bold transition-colors hover:bg-muted/50"
              >
                {item.q}
                <Plus
                  className={`size-5 shrink-0 text-primary transition-transform duration-200 ${open ? "rotate-45" : ""}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    id={`faq-panel-${item.id}`}
                    role="region"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <p className="border-t px-4 py-4 text-sm leading-7 text-muted-foreground">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
