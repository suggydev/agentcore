type TranslationKey = string;

const dict = {
  agents: {
    title: 'Агенты',
    subtitle: 'Твои AI-сотрудники',
    create: 'Новый агент',
    createFirst: 'Создайте первого AI-сотрудника',
    empty: 'Нет агентов',
    delete: 'Удалить',
    edit: 'Редактировать',
    save: 'Сохранить',
    cancel: 'Отмена',
    confirm: 'Подтвердить',
    search: 'Поиск агентов...',
    status: {
      active: 'Активен',
      inactive: 'Неактивен',
      draft: 'Черновик',
      error: 'Ошибка',
    },
    filters: {
      all: 'Все',
      active: 'Активные',
      drafts: 'Черновики',
    },
    newFromTemplate: 'Создать из шаблона',
    fromScratch: 'С нуля',
  },
  editor: {
    title: 'Редактор агента',
    name: 'Название',
    prompt: 'Промпт',
    model: 'Модель',
    temperature: 'Температура',
    maxTokens: 'Макс. токены',
    systemPrompt: 'Системный промпт',
    welcomeMessage: 'Приветственное сообщение',
    save: 'Сохранить',
    saved: 'Сохранено ✓',
    saving: 'Сохраняем...',
    test: 'Тестировать',
    deploy: 'Развернуть',
    advancedSettings: 'Расширенные настройки',
    enhancePrompt: '✨ Улучшить промпт',
    enhanceSoon: 'Функция скоро будет доступна',
    brainMap: 'Brain Map',
    promptPlaceholder: 'Опишите, что должен делать ваш AI-агент...',
    promptUpdated: 'Промпт обновлён',
    settings: 'Настройки',
    chat: 'Чат',
    tabs: {
      prompt: 'Промпт',
      knowledge: 'Знания',
      channels: 'Каналы',
      dialogs: 'Диалоги',
      metrics: 'Метрики',
    },
  },
  chat: {
    title: 'Живой чат-превью',
    emptyTitle: 'Протестируйте агента',
    emptyDesc: 'Отправьте сообщение — агент ответит с текущим промптом',
    inputPlaceholder: 'Написать сообщение...',
    send: 'Отправить',
    loading: 'Думает...',
    suggestedPrompts: {
      greet: 'Привет! Расскажи о себе',
      services: 'Какие услуги вы предоставляете?',
      order: 'Помоги с заказом',
    },
  },
  knowledge: {
    title: 'Знания агента',
    add: 'Добавить',
    upload: 'Загрузить файл',
    uploadHint: 'PDF, DOCX, TXT, MD, CSV',
    dragDrop: 'Перетащите файл сюда',
    parseUrl: 'Вставить URL',
    parseBtn: 'Парсить',
    qaPairs: 'Пары Q&A',
    addQa: 'Добавить пару',
    search: 'Поиск знаний...',
    noItems: 'Пока нет знаний. Добавьте документы или URL.',
    typeFile: 'Файл',
    typeUrl: 'URL',
    typeQa: 'Q&A',
    question: 'Вопрос',
    answer: 'Ответ',
  },
  channels: {
    title: 'Каналы и интеграции',
    connect: 'Подключить',
    connected: 'Подключено',
    configure: 'Настроить',
    disconnect: 'Отключить',
    test: 'Тест',
    comingSoon: 'Скоро',
    comingSoonSection: 'Скоро будет',
    categories: {
      messengers: 'Мессенджеры',
      crm: 'CRM',
      email: 'Почта / Документы',
      automation: 'Автоматизация',
      payments: 'Платежи',
    },
    connectModal: {
      title: 'Подключение',
      stepWhat: 'Что это даёт',
      stepAuth: 'Авторизация',
      stepTest: 'Тест',
      next: 'Далее',
      back: 'Назад',
      testMessage: 'Отправить тестовое сообщение',
      testResult: 'Результат теста',
      testSuccess: 'Тест прошёл успешно!',
      testFail: 'Тест не прошёл. Проверьте настройки.',
    },
  },
  dialogs: {
    title: 'Диалоги агента',
    statusNew: 'новый',
    statusInProgress: 'в работе',
    statusClosed: 'закрыт',
    noConversations: 'Нет диалогов',
    takeover: 'Перехватить',
    takeoverPlaceholder: 'Ответить как оператор...',
    filters: {
      channel: 'Канал',
      dateRange: 'Период',
      status: 'Статус',
    },
  },
  metrics: {
    title: 'Метрики агента',
    dialogsPerDay: 'Диалоги/день',
    avgResponseLength: 'Средняя длина ответа',
    conversion: 'Конверсия',
    tokenCost: 'Стоимость токенов',
    responseTime: 'Время ответа',
    noData: 'Пока нет данных',
    trend: {
      up: '↑',
      down: '↓',
      neutral: '→',
    },
  },
  templates: {
    title: 'Новый агент',
    subtitle: 'Опишите задачу — ИИ подготовит промпт и настройки',
    aiAssist: 'ИИ-помощник',
    aiAssistHint: 'ИИ подготовил промпт и настройки — можете редактировать',
    goalLabel: 'Что должен делать агент?',
    goalPlaceholder: 'Например: отвечать на вопросы клиентов, помогать с выбором товара',
    nameLabel: 'Имя агента',
    namePlaceholder: 'Айгуль, Макс, Елена...',
    promptLabel: 'Системный промпт',
    promptPlaceholder: 'Опишите роль, тон и правила общения агента...',
    emojiLabel: 'Эмодзи',
    createBtn: 'Создать агента',
  },
  settings: {
    title: 'Настройки',
    language: 'Язык',
    account: 'Аккаунт',
    logout: 'Выйти',
  },
  common: {
    loading: 'Загрузка...',
    error: 'Ошибка',
    retry: 'Повторить',
    close: 'Закрыть',
    back: 'Назад',
    next: 'Далее',
    yes: 'Да',
    no: 'Нет',
    undo: 'Отменить',
    copied: 'Скопировано',
    copy: 'Копировать',
    more: 'Ещё',
    delete: 'Удалить',
  },
  toast: {
    success: 'Успешно',
    error: 'Ошибка операции',
    warning: 'Внимание',
    info: 'Информация',
  },
  modal: {
    close: 'Закрыть',
    confirm: 'Подтвердить',
  },
  promptLibrary: {
    title: 'Библиотека вставок',
    toneFriendly: 'Тон: дружелюбный',
    noPolitics: 'Не отвечает на политику',
    clarifyBudget: 'Всегда уточняет бюджет',
    startGreeting: 'Начинает с приветствия',
  },
} as const;

type Dict = typeof dict;

function getNestedValue(obj: Dict, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : undefined;
}

export function t(key: TranslationKey): string {
  return getNestedValue(dict, key) ?? key;
}

export type { Dict };
