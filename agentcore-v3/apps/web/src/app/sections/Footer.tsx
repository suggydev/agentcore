'use client';

import Logo from '../../components/Logo';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-ink-200 py-12 section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-2">
            <Logo className="mb-3" />
            <p className="text-ink-400 max-w-xs text-sm leading-relaxed">
              Платформа структурированного интеллекта для современных операций. 
              Чистая архитектура. Предсказуемые результаты. Создано для профессионалов.
            </p>
            <div className="mt-5 flex items-center gap-3 text-[11px] text-ink-300">
              <span className="font-mono">v3.0.0</span>
              <span className="w-1 h-1 rounded-full bg-ink-200" />
              <span>Structured Intelligence</span>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-ink-900 mb-3 text-sm">Продукт</h4>
            <ul className="space-y-2.5 text-sm text-ink-400">
              <li><a href="#capabilities" className="hover:text-ink-900 transition-colors underline-animated">Возможности</a></li>
              <li><a href="#workflow" className="hover:text-ink-900 transition-colors underline-animated">Как работает</a></li>
              <li><a href="#pricing" className="hover:text-ink-900 transition-colors underline-animated">Тарифы</a></li>
              <li><a href="/dashboard" className="hover:text-ink-900 transition-colors underline-animated">Дашборд</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-ink-900 mb-3 text-sm">Компания</h4>
            <ul className="space-y-2.5 text-sm text-ink-400">
              <li><a href="#" className="hover:text-ink-900 transition-colors underline-animated">О нас</a></li>
              <li><a href="#" className="hover:text-ink-900 transition-colors underline-animated">Блог</a></li>
              <li><a href="#" className="hover:text-ink-900 transition-colors underline-animated">Контакты</a></li>
              <li><a href="#" className="hover:text-ink-900 transition-colors underline-animated">Статус</a></li>
            </ul>
          </div>
        </div>
        
        <div className="arch-line mb-6" />
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-ink-300 text-xs">© 2026 AgentCore. Все права защищены.</p>
          <div className="flex gap-5 text-ink-300 text-xs">
            <a href="#" className="hover:text-ink-500 transition-colors">Конфиденциальность</a>
            <a href="#" className="hover:text-ink-500 transition-colors">Условия</a>
            <a href="#" className="hover:text-ink-500 transition-colors">Безопасность</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
