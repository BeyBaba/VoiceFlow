"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useI18n } from "@/i18n/context";

export default function Testimonials() {
  const { t } = useI18n();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const testimonials = [
    {
      quote: t.testimonials.t1.quote,
      name: t.testimonials.t1.name,
      role: t.testimonials.t1.role,
      avatar: "HC",
      color: "bg-rose-500",
      highlight: true,
    },
    {
      quote: t.testimonials.t2.quote,
      name: t.testimonials.t2.name,
      role: t.testimonials.t2.role,
      avatar: "ZY",
      color: "bg-violet-500",
      highlight: false,
    },
    {
      quote: t.testimonials.t3.quote,
      name: t.testimonials.t3.name,
      role: t.testimonials.t3.role,
      avatar: "BK",
      color: "bg-blue-500",
      highlight: false,
    },
    {
      quote: t.testimonials.t4.quote,
      name: t.testimonials.t4.name,
      role: t.testimonials.t4.role,
      avatar: "ED",
      color: "bg-emerald-500",
      highlight: false,
    },
    {
      quote: t.testimonials.t5.quote,
      name: t.testimonials.t5.name,
      role: t.testimonials.t5.role,
      avatar: "MA",
      color: "bg-orange-500",
      highlight: false,
    },
    {
      quote: t.testimonials.t6.quote,
      name: t.testimonials.t6.name,
      role: t.testimonials.t6.role,
      avatar: "S\u00D6",
      color: "bg-pink-500",
      highlight: false,
    },
    {
      quote: t.testimonials.t7.quote,
      name: t.testimonials.t7.name,
      role: t.testimonials.t7.role,
      avatar: "AY",
      color: "bg-teal-500",
      highlight: false,
    },
    {
      quote: t.testimonials.t8.quote,
      name: t.testimonials.t8.name,
      role: t.testimonials.t8.role,
      avatar: "AK",
      color: "bg-red-500",
      highlight: false,
    },
    {
      quote: t.testimonials.t9.quote,
      name: t.testimonials.t9.name,
      role: t.testimonials.t9.role,
      avatar: "D\u015E",
      color: "bg-cyan-500",
      highlight: false,
    },
  ];

  return (
    <section id="testimonials" className="py-24 sm:py-32">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 mb-4">
            {t.testimonials.badge}
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">
            {t.testimonials.title1}{" "}
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              {t.testimonials.title2}
            </span>
          </h2>
          <p className="text-lg text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
            {t.testimonials.subtitle}
          </p>
        </motion.div>

        {/* Testimonial grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              className={`rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                item.highlight
                  ? "border-teal-500/50 bg-gradient-to-br from-teal-50 to-white dark:from-teal-950/30 dark:to-stone-900/50 shadow-md shadow-teal-200/30 dark:shadow-teal-900/20 sm:col-span-2 lg:col-span-1"
                  : "border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900/30 hover:shadow-stone-100 dark:hover:shadow-stone-900/50"
              }`}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed mb-6">
                &ldquo;{item.quote}&rdquo;
              </p>

              {/* Accessibility badge for highlighted */}
              {item.highlight && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-xs font-semibold mb-4">
                  {t.testimonials.accessibilityBadge}
                </div>
              )}

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                  {item.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold">{item.name}</div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">{item.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
