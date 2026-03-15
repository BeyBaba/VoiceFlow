"use client";
import { motion } from "framer-motion";

const companies = [
  "Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix",
  "Spotify", "Uber", "Airbnb", "Stripe", "Shopify", "Slack",
  "Notion", "Figma", "Vercel", "GitHub", "OpenAI", "Tesla",
  "Samsung", "Adobe",
];

export default function TrustedBy() {
  return (
    <section className="relative py-12 overflow-hidden border-y border-stone-100 dark:border-stone-800/50">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <p className="text-center text-sm font-medium text-stone-400 dark:text-stone-500 mb-8 tracking-wider uppercase">
          Her yerden profesyoneller kullanıyor
        </p>

        {/* Marquee Row 1 */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white dark:from-[#0B0B12] to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white dark:from-[#0B0B12] to-transparent z-10" />

          <div className="flex animate-marquee">
            {[...companies, ...companies].map((name, i) => (
              <div
                key={`${name}-${i}`}
                className="flex-shrink-0 mx-6 flex items-center justify-center"
              >
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-700/30">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-600 dark:to-stone-700 flex items-center justify-center text-xs font-bold text-stone-500 dark:text-stone-300">
                    {name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">
                    {name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Marquee Row 2 (reverse) */}
        <div className="relative mt-4">
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white dark:from-[#0B0B12] to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white dark:from-[#0B0B12] to-transparent z-10" />

          <div className="flex animate-marquee-reverse">
            {[...companies.slice(10), ...companies.slice(0, 10), ...companies.slice(10), ...companies.slice(0, 10)].map((name, i) => (
              <div
                key={`rev-${name}-${i}`}
                className="flex-shrink-0 mx-6 flex items-center justify-center"
              >
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-700/30">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-600 dark:to-stone-700 flex items-center justify-center text-xs font-bold text-stone-500 dark:text-stone-300">
                    {name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">
                    {name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
