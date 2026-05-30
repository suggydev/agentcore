'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const PLANS = [
  {
    name: 'Стартовый',
    price: 'Бесплатно',
    period: '',
    description: 'Для индивидуальных исследователей структурированной автоматизации.',
    features: ['3 агента', '1 000 операций', '2 канала', 'Базовая аналитика', 'Поддержка сообщества'],
    cta: 'Начать бесплатно',
    popular: false,
  },
  {
    name: 'Профессиональный',
    price: '$29',
    period: '/месяц',
    description: 'Для команд, создающих production workflow.',
    features: ['10 агентов', '10 000 операций', 'Все каналы', 'Расширенная аналитика', 'Приоритетная поддержка', 'Кастомные модули', 'API-доступ'],
    cta: 'Пробный период',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/месяц',
    description: 'Для органций с высокими масштабами.',
    features: ['Безлимитные агенты', 'Безлимитные операции', 'Все каналы + SSO', 'Полный аналитический набор', 'Круглосуточная поддержка', 'Кастомная инфраструктура', 'Аудит и compliance'],
    cta: 'Связаться с отделом продаж',
    popular: false,
  },
];

export default function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current?.querySelectorAll('.reveal') || [], {
        y: 35,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      });

      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.from(card, {
          y: 50,
          opacity: 0,
          duration: 0.7,
          delay: i * 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="pricing" className="py-20 lg:py-24 section-padding relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-mauve-50/20 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        <div ref={headerRef} className="text-center mb-14">
          <span className="label text-mauve-600 mb-3 block reveal">Тарифы</span>
          <h2 className="heading-2 text-ink-900 mb-3 reveal">
            Прозрачное структурированное ценообразование
          </h2>
          <p className="body-large max-w-lg mx-auto reveal">
            Никаких скрытых уровней. Чёткие лимиты. Предсказуемое масштабирование.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 items-start">
          {PLANS.map((plan, i) => (
            <div
              key={plan.name}
              ref={el => { cardsRef.current[i] = el; }}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <motion.div 
                className={`relative p-7 rounded-2xl border transition-colors duration-300 ${
                  plan.popular 
                    ? 'border-ink-900 bg-white shadow-xl' 
                    : 'border-ink-200/80 bg-white/70 backdrop-blur-sm'
                }`}
                animate={{
                  y: hoveredCard === i ? -6 : 0,
                  scale: hoveredCard === i ? 1.01 : 1,
                }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-6">
                    <span className="px-3 py-1 rounded-full bg-ink-900 text-white text-[11px] font-semibold flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Популярный
                    </span>
                  </div>
                )}

                <h3 className="font-mono-display font-semibold text-base text-ink-900 mb-0.5">
                  {plan.name}
                </h3>
                <p className="text-xs text-ink-400 mb-5">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-3xl font-mono-display font-bold text-ink-900">{plan.price}</span>
                  <span className="text-ink-400 text-sm">{plan.period}</span>
                </div>

                <div className="h-px bg-gradient-to-r from-ink-100 via-ink-200 to-ink-100 mb-5" />

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-ink-600">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                        plan.popular ? 'bg-mauve-50' : 'bg-ink-50'
                      }`}>
                        <Check className={`w-3 h-3 ${plan.popular ? 'text-mauve-600' : 'text-ink-400'}`} />
                      </div>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  plan.popular 
                    ? 'btn-primary' 
                    : 'btn-secondary'
                }`}>
                  {plan.cta}
                </button>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
