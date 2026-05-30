'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { Users, Workflow, Zap, Database, ArrowDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const LAYERS = [
  {
    title: 'Слой интерфейса',
    subtitle: 'Web · Чат · API · Голос',
    icon: Users,
    tags: ['Web', 'Telegram', 'WhatsApp', 'API'],
    bg: 'bg-white',
    border: 'border-ink-200',
    iconBg: 'bg-mauve-50',
    iconColor: 'text-mauve-600',
    shadow: 'shadow-sm',
    tagStyle: 'bg-ink-50 text-ink-600 border border-ink-100',
  },
  {
    title: 'Маршрутизатор',
    subtitle: 'Smart-модели · Классификация задач',
    icon: Workflow,
    tags: ['Code', 'Vision', 'Creative', 'Analysis', 'General', 'Voice'],
    bg: 'bg-mauve-50',
    border: 'border-mauve/15',
    iconBg: 'bg-mauve-600',
    iconColor: 'text-white',
    shadow: '',
    tagStyle: 'bg-white border border-mauve/10 text-ink-600',
  },
  {
    title: 'Слой обработки',
    subtitle: '9+ специализированных моделей · Параллельное исполнение',
    icon: Zap,
    tags: [],
    bg: 'bg-white',
    border: 'border-ink-200',
    iconBg: 'bg-ink-100',
    iconColor: 'text-ink-600',
    shadow: 'shadow-sm',
    tagStyle: '',
  },
  {
    title: 'Выход и хранение',
    subtitle: 'Структурированные ответы · Аудит · Аналитика',
    icon: Database,
    tags: ['Диалоги', 'CRM', 'База знаний', 'Отчёты'],
    bg: 'bg-ink-900',
    border: 'border-ink-800',
    iconBg: 'bg-white/10',
    iconColor: 'text-white',
    shadow: '',
    tagStyle: 'bg-white/10 text-ink-200',
    textColor: 'text-white',
    subColor: 'text-ink-300',
  },
];

export default function ArchitectureSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const layersRef = useRef<(HTMLDivElement | null)[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);

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
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });

      layersRef.current.forEach((layer) => {
        if (!layer) return;
        gsap.from(layer, {
          clipPath: 'inset(0 100% 0 0)',
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: layer,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        });

        gsap.from(layer.querySelectorAll('.inner-reveal'), {
          y: 15,
          opacity: 0,
          duration: 0.5,
          stagger: 0.06,
          delay: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: layer,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        });
      });

      gsap.from('.arch-connector', {
        scaleY: 0,
        transformOrigin: 'top',
        duration: 0.4,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 65%',
          toggleActions: 'play none none none',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 lg:py-24 section-padding relative overflow-hidden">
      <div className="absolute inset-0 grid-lines opacity-35" />
      
      <div className="max-w-3xl mx-auto relative">
        <div ref={headerRef} className="text-center mb-14">
          <span className="label text-mauve-600 mb-3 block reveal">Архитектура системы</span>
          <h2 className="heading-2 text-ink-900 mb-3 reveal">
            Как устроена система
          </h2>
          <p className="body-large max-w-lg mx-auto reveal">
            Чёткие слои. Определённые интерфейсы. Предсказуемый поток данных.
          </p>
        </div>

        <div className="relative space-y-0">
          {LAYERS.map((layer, i) => (
            <div key={layer.title}>
              <motion.div
                ref={el => { layersRef.current[i] = el; }}
                className={`${layer.bg} rounded-2xl border ${layer.border} ${layer.shadow} p-5 md:p-6 relative`}
                whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              >
                <div className="flex items-center gap-3 mb-3 inner-reveal">
                  <div className={`w-9 h-9 rounded-lg ${layer.iconBg} flex items-center justify-center`}>
                    <layer.icon className={`w-4 h-4 ${layer.iconColor}`} />
                  </div>
                  <div>
                    <div className={`font-semibold text-sm ${layer.textColor || 'text-ink-900'}`}>{layer.title}</div>
                    <div className={`text-xs ${layer.subColor || 'text-ink-400'}`}>{layer.subtitle}</div>
                  </div>
                </div>
                
                {layer.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 inner-reveal">
                    {layer.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${layer.tagStyle}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {i < LAYERS.length - 1 && (
                  <div className="hidden md:block absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full z-10">
                    <div className="arch-connector w-px h-6 bg-gradient-to-b from-ink-200 to-transparent" />
                  </div>
                )}
              </motion.div>

              {i < LAYERS.length - 1 && (
                <div className="flex justify-center py-2 arch-connector">
                  <motion.div
                    animate={{ y: [0, 3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                  >
                    <ArrowDown className="w-4 h-4 text-ink-300" />
                  </motion.div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Side annotation */}
        <div className="hidden lg:block absolute -right-12 top-1/2 -translate-y-1/2">
          <div className="w-px h-40 bg-gradient-to-b from-transparent via-ink-200 to-transparent" />
          <div className="absolute top-1/2 left-2 -translate-y-1/2 whitespace-nowrap">
            <span className="label text-ink-300 rotate-90 origin-left block">Поток данных</span>
          </div>
        </div>
      </div>
    </section>
  );
}
