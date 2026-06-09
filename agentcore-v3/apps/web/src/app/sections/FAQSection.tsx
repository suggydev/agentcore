'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { FAQ_ITEMS } from '../../data/landingContent';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section id="faq" className="py-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-[6px] bg-[#f8f7f4] text-xs font-semibold text-[#343433] tracking-wide uppercase mb-4">
            FAQ
          </span>
          <h2 className="heading-2 mb-3">
            Часто задаваемые вопросы
          </h2>
          <p className="body-large max-w-lg mx-auto">
            Всё, что нужно знать перед стартом
          </p>
        </motion.div>

        <div className="space-y-3 max-w-3xl mx-auto">
          {FAQ_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <div className="rounded-[10px] bg-white transition-colors duration-200 cursor-pointer"
                style={{ boxShadow: 'color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset' }}
                onClick={() => toggle(i)}
              >
                <button className="w-full flex items-center justify-between p-5 text-left">
                  <span className="text-base font-semibold text-[#343433] pr-4">{item.question}</span>
                  <motion.span
                    animate={{ rotate: openIndex === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="w-5 h-5 text-[#848281]" />
                  </motion.span>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openIndex === i ? 'auto' : 0, opacity: openIndex === i ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 text-[#474645] text-sm leading-relaxed">
                    {item.answer}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
