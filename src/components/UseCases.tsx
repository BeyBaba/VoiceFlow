"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useI18n } from "@/i18n/context";

export default function UseCases() {
  const { t } = useI18n();

  const useCases = [
    {
      id: "developers",
      label: t.useCases.developers.label,
      icon: "\uD83D\uDCBB",
      title: t.useCases.developers.title,
      description: t.useCases.developers.description,
      stats: t.useCases.developers.stats,
      color: "from-blue-500/10 to-indigo-500/10",
    },
    {
      id: "students",
      label: t.useCases.students.label,
      icon: "\uD83C\uDF93",
      title: t.useCases.students.title,
      description: t.useCases.students.description,
      stats: t.useCases.students.stats,
      color: "from-green-500/10 to-emerald-500/10",
    },
    {
      id: "creators",
      label: t.useCases.creators.label,
      icon: "\uD83C\uDFA8",
      title: t.useCases.creators.title,
      description: t.useCases.creators.description,
      stats: t.useCases.creators.stats,
      color: "from-purple-500/10 to-pink-500/10",
    },
    {
      id: "sales",
      label: t.useCases.sales.label,
      icon: "\uD83D\uDCC8",
      title: t.useCases.sales.title,
      description: t.useCases.sales.description,
      stats: t.useCases.sales.stats,
      color: "from-orange-500/10 to-red-500/10",
    },
    {
      id: "accessibility",
      label: t.useCases.accessibility.label,
      icon: "\u267F",
      title: t.useCases.accessibility.title,
      description: t.useCases.accessibility.description,
      stats: t.useCases.accessibility.stats,
      color: "from-teal-500/10 to-cyan-500/10",
    },
    {
      id: "lawyers",
      label: t.useCases.lawyers.label,
      icon: "\u2696\uFE0F",
      title: t.useCases.lawyers.title,
      description: t.useCases.lawyers.description,
      stats: t.useCases.lawyers.stats,
      color: "from-amber-500/10 to-yellow-500/10",
    },
    {
      id: "support",
      label: t.useCases.support.label,
      icon: "\uD83C\uDFA7",
      title: t.useCases.support.title,
      description: t.useCases.support.description,
      stats: t.useCases.support.stats,
      color: "from-rose-500/10 to-pink-500/10",
    },
    {
      id: "leaders",
      label: t.useCases.leaders.label,
      icon: "\uD83D\uDC54",
      title: t.useCases.leaders.title,
      description: t.useCases.leaders.description,
      stats: t.useCases.leaders.stats,
      color: "from-sky-500/10 to-blue-500/10",
    },
  ];

  const [active, setActive] = useState(useCases[0].id);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const activeCase = useCases.find((u) => u.id === active)!;

  return (
    <section id="usecases" className="py-24 sm:py-32 bg-white">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            {t.useCases.title1}{" "}
            <span className="gradient-text">{t.useCases.title2}</span>
          </h2>
          <p className="text-lg text-text-muted max-w-xl mx-auto">
            {t.useCases.subtitle}
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {useCases.map((uc) => (
            <button
              key={uc.id}
              onClick={() => setActive(uc.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                active === uc.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-stone-100 text-text-muted hover:bg-stone-200"
              }`}
            >
              <span className="mr-1.5">{uc.icon}</span>
              {uc.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCase.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className={`bg-gradient-to-br ${activeCase.color} rounded-3xl p-8 sm:p-12 border border-stone-100`}
          >
            <div className="max-w-2xl mx-auto text-center">
              <div className="text-5xl mb-6">{activeCase.icon}</div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                {activeCase.title}
              </h3>
              <p className="text-text-muted text-lg mb-8 leading-relaxed">
                {activeCase.description}
              </p>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 text-primary font-semibold text-sm">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                  />
                </svg>
                {activeCase.stats}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
