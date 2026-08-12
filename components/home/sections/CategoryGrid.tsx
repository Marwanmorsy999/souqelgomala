import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { getHomepageTiles } from "@/lib/categorization";

interface CategoryGridProps {
  /** Called with a taxonomy category id, or the "offers" sentinel. */
  onCategorySelect: (category: string) => void;
}

// The homepage shows the unified taxonomy tiles (ids match the D1 categories
// exactly) plus a synthetic "offers" tile that jumps to the daily-offers strip.
const TILES = [
  { id: "offers", name: "العروض", image: "/العروض.webp" },
  ...getHomepageTiles().map((t) => ({ id: t.id, name: t.nameAr, image: t.image })),
];

const CATEGORIES = [
  { name: "العروض", image: "/العروض.webp", path: "العروض" },
  { name: "السكر والشاي والقهوة", image: "/السكر والشاى والقهوه.webp", path: "السكر والشاي والقهوة" },
  { name: "الأرز والمكرونات", image: "/الارز والمكرونات.webp", path: "الأرز والمكرونات" },
  { name: "الزيوت", image: "/الزيوت.webp", path: "الزيوت" },
  { name: "مشتقات الألبان", image: "/منتجات الالبان.webp", path: "مشتقات الألبان" },
  { name: "البهارات", image: "/بهارات.webp", path: "البهارات" },
  { name: "الصلصات والصوصات", image: "/الصلصات والصوصات.webp", path: "الصلصات" },
  { name: "المعلبات", image: "/المعلبات.webp", path: "المعلبات" },
  { name: "المخبوزات والبسكويت", image: "/المخبوزات والبسكوت.webp", path: "المخبوزات والبسكويت" },
  { name: "المياه والمرطبات", image: "/مياه والمشروبات الغازيه.webp", path: "المياه والمرطبات" },
  { name: "البلاستيكية والمنظفات", image: "/البلاستيكات والمنظفات.webp", path: "المنظفات" },
  { name: "العناية بالطفل", image: "/العنايه بالطفل.webp", path: "العناية بالطفل" },
  { name: "بقالة", image: "/بقاله.webp", path: "بقالة" },
  { name: "جملة بالكرتون", image: "/بالكرتونه.webp", path: "بالكرتونة" },
];

export function CategoryGrid({ onCategorySelect }: CategoryGridProps) {
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);
  const fullText = "تسوق على حسب اقسامنا";

  useEffect(() => {
    const handleType = () => {
      setText((current) => {
        if (!isDeleting && current === fullText) {
          // Pause at the end before deleting
          setTypingSpeed(1500);
          setIsDeleting(true);
          return current;
        } else if (isDeleting && current === "") {
          // Pause briefly before typing again
          setIsDeleting(false);
          setTypingSpeed(500);
          return current;
        }

        const nextSpeed = isDeleting ? 50 : 100;
        setTypingSpeed(nextSpeed);

        return isDeleting 
          ? fullText.substring(0, current.length - 1)
          : fullText.substring(0, current.length + 1);
      });
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, typingSpeed, fullText]);

  return (
    <section className="site-section section-vrh bg-background">
      <div className="flex items-center justify-between mb-4 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight mb-2 min-h-[28px] sm:min-h-[36px] flex items-center">
            {text}
            <span className="animate-pulse w-[3px] h-5 sm:h-8 bg-primary mr-1 rounded-full" />
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">تصفح جميع المنتجات حسب القسم</p>
        </div>
      </div>

      {/* Flex-wrap + justify-center keeps every row visually balanced — the
          final (short) row is centered instead of leaving orphaned cards. */}
      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-4 lg:gap-6">
        {TILES.map((cat, index) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            onClick={() => onCategorySelect(cat.id)}
            className="group category-grid-tile cursor-pointer flex w-[calc(25%-0.375rem)] flex-col items-center rounded-none sm:w-[calc(33.333%-0.7rem)] sm:rounded-2xl sm:bg-card sm:border sm:border-border sm:overflow-hidden product-card-hover lg:w-[calc(25%-1.2rem)]"
          >
            <div className="relative w-full h-[80px] overflow-hidden rounded-lg flex items-center justify-center sm:aspect-square sm:h-auto sm:bg-[#f2f0ea] sm:p-4 sm:rounded-xl sm:border sm:border-black/10 sm:shadow-md sm:shadow-black/40">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover sm:object-contain transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            
            <div className="w-full mt-1.5 sm:mt-0 sm:p-4 sm:flex sm:items-center sm:justify-between sm:bg-card sm:z-10 sm:border-t sm:border-border">
              <h3 className="text-[11px] sm:text-sm leading-tight font-semibold text-center sm:text-start text-foreground group-hover:text-primary transition-colors line-clamp-2 sm:min-h-[3rem] sm:flex sm:items-center">
                {cat.name}
              </h3>
              <div className="hidden sm:flex size-7 sm:size-8 rounded-full bg-surface-alt items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                <ChevronLeft className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}