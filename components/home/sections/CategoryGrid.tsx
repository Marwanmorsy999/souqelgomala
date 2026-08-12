import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";

interface CategoryGridProps {
  onCategorySelect: (category: string) => void;
}

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
    let timer: NodeJS.Timeout;
    
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

    timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, typingSpeed, fullText]);

  return (
    <section className="site-section section-vrh bg-background">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 min-h-[36px] flex items-center">
            {text}
            <span className="animate-pulse w-[3px] h-6 sm:h-8 bg-primary mr-1 rounded-full" />
          </h2>
          <p className="text-muted-foreground">تصفح جميع المنتجات حسب القسم</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {CATEGORIES.map((cat, index) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            onClick={() => onCategorySelect(cat.path)}
            className="group cursor-pointer flex flex-col items-center bg-card rounded-2xl border border-border overflow-hidden product-card-hover"
          >
            <div className="w-full aspect-square bg-surface-alt relative overflow-hidden flex items-center justify-center p-4">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            
            <div className="w-full p-4 flex items-center justify-between bg-card z-10 border-t border-border">
              <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {cat.name}
              </h3>
              <div className="size-8 rounded-full bg-surface-alt flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                <ChevronLeft className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
