const express = require('express');
const axios = require('axios');
const { authenticate } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');
const config = require('../config');

const router = express.Router();

/* ───────────────────────── helpers ───────────────────────── */

const CHANNEL_TONES = {
  telegram: 'Telegram: дружеский, живой стиль как в переписке с другом. КОРОТКИЕ сообщения (1-3 предложения). НЕ используй точки в конце абзаца — используй перенос строки или пробел. НЕ используй длинное тире «—» — используй короткое дефис «-». НЕ используй кавычки-ёлочки «» или скобки (). Эмодзи умеренно (1-2 на сообщение). Пиши без формальностей, без "Уважаемый/Здравствуйте". Можно сокращения ("прив", "ок", "спс"). Пример: "Привет! Да, у нас есть в наличии \uD83D\uDE0A Стоит 1500₽ Доставка завтра — ок?"',
  whatsapp: 'WhatsApp: разговорный, дружеский стиль. Короткие сообщения (1-3 предложения). Без формальностей. Можно использовать эмодзи (2-3 на сообщение). Без заглавных в начале каждого предложения если не нужно. Можно сокращения. Без точек в конце — используй перенос строки. Пиши как в чате с подругой/другом. Пример: "привет! да, конечно \uD83D\uDE0A когда тебе удобно?"',
  vk: 'VK: неформальный, молодёжный стиль. Можно слэнг ("кринж", "имба", "факт", "пон", "rip"). Можно мемы-ссылки. Эмодзи активно (3-5 на сообщение). Можно заглавные для эмоций ("ОФИГЕТЬ"). Короткие ответы (1-2 предложения). Без точек в конце. Можно многоточие... Можно скобочки для эмоций ))) . Пример: "Ооо привет))) Да, в наличии есть \uD83D\uDE0E 1500₽, доставка завтра курьером"',
  instagram: 'Instagram: яркий, визуальный, трендовый стиль. Хэштеги (#тренд, #бизнес). Эмодзи обильно (5-8 на сообщение). Коротко и по делу (1-2 предложения). Можно использовать фразы из трендов. Без точек в конце — перенос строки или эмодзи. Пример: "Привет\uD83D\uDE0A✨ Да, есть в наличии! 1500₽ \uD83D\uDC8E Доставка завтра \uD83D\uDE9A #доставка #скидка"',
  facebook: 'Facebook: нейтрально-дружелюбный. Средняя длина (2-4 предложения). Эмодзи умеренно (1-2). Вежливый, но не сухой. Можно использовать полные предложения с точками. Пример: "Здравствуйте! Да, товар в наличии. Стоимость 1500₽. Доставка возможна завтра."',
  avito: 'Avito: деловой, но не сухой. Прямо по делу. Цены, условия, доставка — чётко и без лишнего. Средняя длина (2-3 предложения). Без эмодзи или 1 максимум. Точки обязательны. Пример: "Добрый день. Товар в наличии, цена 1500₽. Доставка курьером 300₽, завтра."',
  email: 'Email: формальный, структурированный. Приветствие, основная часть, подпись. Пункты списком (• или -). Средняя длина (4-6 предложений). Точки обязательны. Без эмодзи. Пример: "Здравствуйте, [Имя]. Благодарим за интерес к нашему товару. - Цена: 1500₽ - Доставка: курьером, 300₽, завтра - Оплата: картой или наличными С уважением, Команда [Компания]"',
  sms: 'SMS: максимально коротко, до 160 символов. Только суть. Без приветствия. Без эмодзи. Без точек в конце. Только цифры и факты. Пример: "В наличии 1500₽ Доставка 300₽ завтра Заказать: ответьте ДА"',
  discord: 'Discord: геймерский/неформальный. Можно слэнг ("гг", "лол", "кек", "ф", "погнали"). Можно мемы. Эмодзи активно (3-5 на сообщение). Короткие ответы (1-2 предложения). Можно заглавные для эмоций. Без точек в конце. Пример: "ПРИВЕТ))) Да, в наличии \uD83D\uDE0E 1500₽, доставка завтра, погнали \uD83D\uDE80"',
  viber: 'Viber: дружеский, разговорный. Эмодзи и стикеры приветствуются (3-5). Короткие сообщения (1-3 предложения). Без формальностей. Можно сокращения. Без точек в конце — используй перенос. Пример: "Привет \uD83D\uDE0A Да, есть! 1500₽ Доставка завтра, ок? \uD83D\uDE9A"',
  yandexmessenger: 'Яндекс Мессенджер: деловой, но тёплый. Коротко, по делу (2-3 предложения). Эмодзи умеренно (1-2). Без сокращений. Точки обязательны. Вежливый тон. Пример: "Здравствуйте. Товар в наличии, стоимость 1500₽. Доставка завтра курьером."',
  webchat: 'Веб-чат: профессиональный, но дружелюбный. Средняя длина (2-4 предложения). Чёткие ответы. Эмодзи умеренно (1-2). Точки обязательны. Вежливый, но не сухой. Пример: "Здравствуйте! Да, товар в наличии. Стоимость 1500₽. Доставка завтра курьером по вашему адресу."',
  default: 'Универсальный стиль: вежливый, профессиональный, но тёплый. Адаптируйся под контекст. Средняя длина (2-4 предложения). Эмодзи умеренно (1-2). Точки обязательны. Пример: "Здравствуйте! Да, товар в наличии. Стоимость 1500₽. Доставка возможна завтра."'
};

const BATCH_CLARIFICATION_PROMPT = (goal, companyName, industry, channel = '', previousAnswers = {}) =>
  `Ты — эксперт по созданию AI-агентов для бизнеса. Ты анализируешь задачу пользователя и генерируешь УТОЧНЯЮЩИЕ ВОПРОСЫ, чтобы создать идеального агента.

## Задача пользователя
"${goal.trim()}"

## Контекст
Компания: "${companyName || 'Неизвестно'}"
Отрасль: "${industry || 'Неизвестно'}"
Канал: "${channel || 'Неизвестно'}"

## Предыдущие ответы пользователя
${Object.entries(previousAnswers).length > 0
  ? Object.entries(previousAnswers).map(([k, v]) => {
    const val = Array.isArray(v) ? v.join(', ') : v;
    return `- ${k}: ${val}`;
  }).join('\n')
  : 'Нет ответов'}

## Твоя задача
Проанализируй описание задачи и предыдущие ответы. Определи, какие аспекты ещё НЕЯСНЫ и нужно уточнить для создания идеального агента.

Генерируй вопросы ИНТЕЛЛЕКТУАЛЬНО — учитывай контекст:
- Если задача про "поддержку клиентов" для интернет-магазина — спрашивай про товары, доставку, возвраты, способы оплаты
- Если задача про "продажи" — спрашивай про воронку, квалификацию лидов, ценообразование, скидки
- Если задача про "запись" — спрашивай про расписание, услуги, напоминания, отмены
- Если канал Instagram — спрашивай про визуальный контент, хэштеги, тренды
- Если канал Avito — спрашивай про товары, цены, торг, доставку, встречи
- Если отрасль "медицина" — спрашивай про специализации, запись, конфиденциальность
- Если отрасль "недвижимость" — спрашивай про типы объектов, цены, показы, документы

Каждый вопрос должен быть:
1. КОНКРЕТНЫМ — не абстрактным, а прямо связанным с задачей
2. ПОЛЕЗНЫМ — ответ на него реально повлияет на создание агента
3. ПЕРСОНАЛИЗИРОВАННЫМ — сформулированным с учётом уже известного контекста

## Формат ответа
Верни JSON с вопросами (3-5 вопросов, НЕ БОЛЬШЕ 5):
{
  "needsClarification": true,
  "questions": [
    {
      "id": "q1",
      "question": "Конкретный персонализированный вопрос",
      "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Свой вариант"],
      "type": "single_choice"
    },
    {
      "id": "q2",
      "question": "Вопрос с множественным выбором",
      "options": ["Вариант A", "Вариант B", "Вариант C", "Вариант D", "Свой вариант"],
      "type": "multiple_choice"
    }
  ],
  "reasoning": "Почему эти вопросы важны (1-2 предложения)"
}

Важно: type может быть:
- "single_choice" — пользователь выбирает ТОЛЬКО ОДИН вариант (для взаимоисключающих: тон, аудитория, размер бизнеса)
- "multiple_choice" — пользователь может выбрать НЕСКОЛЬКО вариантов (для сценариев, функций, каналов, категорий)
- ВСЕГДА добавляй "Свой вариант" как последний option

Если информации ДОСТАТОЧНО (редкий случай) — верни:
{
  "needsClarification": false,
  "generated": {
    "name": "Имя агента (краткое, 2-3 слова, имя собственное под задачу)",
    "emoji": "Подходящий эмодзи для роли",
    "systemPrompt": "Полный детальный системный промпт для агента (минимум 15 строк, на русском). Включи: роль, личность, правила общения, сценарии, контекст компании, запрещённые темы, стиль ответов.",
    "description": "Краткое описание агента 1-2 предложения",
    "model": "glm-5p1",
    "brainNodes": ["greeting", "qualification", "faq", "leadCapture", "escalation", "memory"],
    "confidence": 0.95
  },
  "reasoning": "Почему агент создан именно так"
}

Важно: отвечай ТОЛЬКО JSON, без markdown, без пояснений. Максимум 5 вопросов.`;

const GENERATION_PROMPT = (goal, companyName, industry, answers, history = [], channel = '') => {
  const answersText = Object.entries(answers)
    .filter(([k]) => !k.startsWith('_'))
    .map(([k, v]) => {
      const val = Array.isArray(v) ? v.join(', ') : v;
      return `- ${k}: ${val}`;
    })
    .join('\n');

  const historyText = history.length > 0
    ? `\nИстория диалога:\n${history.map(m => `${m.role === 'user' ? 'Пользователь' : 'AI'}: ${m.content}`).join('\n')}\n`
    : '';

  const tone = CHANNEL_TONES[channel] || CHANNEL_TONES.default;

  return `Ты — эксперт по созданию AI-агентов для бизнеса. Сейчас ты генерируешь агента для пользователя.

## Задача
"${goal.trim()}"

## Контекст
Компания: ${companyName || 'Неизвестно'}
Отрасль: ${industry || 'Неизвестно'}
Канал: ${channel || 'Универсальный'}

## Уточнения от пользователя
${answersText || 'Нет уточнений'}${historyText}

## Тон общения для канала
${tone}

## Твоя роль
Ты ведёшь процесс генерации агента в формате диалога. Покажи пользователю процесс мышления:

1. Сначала подумай aloud: что ты понял из описания, какие аспекты учитываешь
2. Если тебе НЕ ХВАТАЕТ информации — задай 1-2 коротких уточняющих вопроса (в чат-формате)
3. Если информации ДОСТАТОЧНО — сгенерируй агента и покажи результат

## Финальный формат (когда готов сгенерировать)
В конце ОБЯЗАТЕЛЬНО верни JSON-шаблон:

---AGENT_JSON---
{
  "name": "Имя агента (краткое, 2-3 слова)",
  "emoji": "Подходящий эмодзи",
  "systemPrompt": "Полный детальный системный промпт (минимум 15 строк, на русском). Включи: роль, личность, правила общения, сценарии, контекст компании, запрещённые темы, стиль ответов. ОБЯЗАТЕЛЬНО включи инструкции по тону для канала: ${tone}",
  "description": "Краткое описание 1-2 предложения",
  "model": "glm-5p1",
  "brainNodes": ["greeting", "qualification", "faq", "leadCapture", "escalation", "memory"],
  "confidence": 0.95,
  "channel": "${channel || ''}"
}
---END_JSON---

Важно: до JSON общайся естественно, как AI-ассистент. JSON только в конце, внутри маркеров.`;
};

async function callAI(prompt, stream = false) {
  return axios.post(
    `${config.SUGGY_BASE_URL}/chat/completions`,
    {
      model: 'accounts/fireworks/models/glm-5p1',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 4000,
      stream
    },
    {
      headers: {
        Authorization: `Bearer ${config.SUGGY_PROJECT_KEY}`,
        'X-Account-Id': config.SUGGY_ACCOUNT_ID,
        'Content-Type': 'application/json'
      },
      timeout: 45000,
      responseType: stream ? 'stream' : 'json'
    }
  );
}

function parseAIResponse(aiText) {
  // Extract JSON from response
  let result;
  try {
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      result = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found');
    }
  } catch (parseErr) {
    console.error('[AgentGenerate] Failed to parse AI response:', aiText.substring(0, 500));
    result = null;
  }
  return result;
}

function extractAgentJson(aiText) {
  const markerMatch = aiText.match(/---AGENT_JSON---\s*([\s\S]*?)\s*---END_JSON---/);
  if (markerMatch) {
    try {
      return JSON.parse(markerMatch[1]);
    } catch (e) {
      console.error('[AgentGenerate] Failed to parse agent JSON from markers:', e.message);
    }
  }
  // Fallback: try to find any JSON object with name/emoji/systemPrompt
  const jsonMatch = aiText.match(/\{[\s\S]*"name"[\s\S]*"systemPrompt"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('[AgentGenerate] Fallback JSON parse failed:', e.message);
    }
  }
  return null;
}

function buildFallbackAgent(goal, companyName) {
  return {
    name: goal.slice(0, 30) + (goal.length > 30 ? '...' : ''),
    emoji: '🤖',
    systemPrompt: `# РОЛЬ\nТы — AI-ассистент для компании "${companyName || 'Компания'}".\n\n# ЗАДАЧА\n${goal}\n\n# ПРАВИЛА\n- Общайся вежливо и профессионально\n- Отвечай на вопросы клиентов\n- Если не знаешь ответ — предложи связаться с оператором\n- Не раскрывай, что ты ИИ или бот\n\n# КОНТЕКСТ\nКомпания: ${companyName || 'Компания'}`,
    description: goal,
    model: 'glm-5p1',
    brainNodes: ['greeting', 'faq', 'escalation'],
    confidence: 0.6
  };
}

/* ───────────────────────── routes ───────────────────────── */

// Step 1: Get ALL clarification questions at once (batch)
router.post('/', authenticate, generalLimiter, async (req, res) => {
  try {
    const { goal, companyName, industry, channel, previousAnswers = {} } = req.body;

    if (!goal || typeof goal !== 'string' || goal.trim().length < 3) {
      return res.status(400).json({ error: 'Опишите задачу агента (минимум 3 символа)' });
    }

    const response = await callAI(BATCH_CLARIFICATION_PROMPT(goal, companyName, industry, channel, previousAnswers), false);
    const aiText = response.data.choices?.[0]?.message?.content || '';
    const result = parseAIResponse(aiText);

    if (!result) {
      return res.status(200).json({
        needsClarification: true,
        questions: [
          {
            id: 'q1',
            question: 'Какой тон общения должен использовать агент?',
            options: ['Дружелюбный и неформальный', 'Профессиональный и строгий', 'Энергичный и продающий', 'Свой вариант'],
            type: 'single_choice'
          },
          {
            id: 'q2',
            question: 'Какие каналы и сценарии нужны агенту?',
            options: ['Ответы на вопросы клиентов', 'Консультация по товарам', 'Сбор заявок и контактов', 'Оформление заказа', 'Отслеживание доставки', 'Работа с возвратами', 'Свой вариант'],
            type: 'multiple_choice'
          },
          {
            id: 'q3',
            question: 'Кто основная целевая аудитория?',
            options: ['B2C — обычные покупатели', 'B2B — бизнес-клиенты', 'Смешанная', 'Свой вариант'],
            type: 'single_choice'
          }
        ],
        reasoning: 'Стандартные уточнения (AI не ответил корректно)'
      });
    }

    res.json(result);
  } catch (err) {
    console.error('[AgentGenerate] Batch questions error:', err.message);
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return res.status(504).json({ error: 'AI-модель не отвечает. Попробуйте снова.' });
    }
    res.status(502).json({ error: 'Ошибка генерации агента. Попробуйте позже.' });
  }
});

// Step 1b: Get NEXT question dynamically (after answering some questions)
router.post('/next-question', authenticate, generalLimiter, async (req, res) => {
  try {
    const { goal, companyName, industry, channel, previousAnswers = {} } = req.body;

    if (!goal || typeof goal !== 'string' || goal.trim().length < 3) {
      return res.status(400).json({ error: 'Опишите задачу агента (минимум 3 символа)' });
    }

    const response = await callAI(BATCH_CLARIFICATION_PROMPT(goal, companyName, industry, channel, previousAnswers), false);
    const aiText = response.data.choices?.[0]?.message?.content || '';
    const result = parseAIResponse(aiText);

    if (!result || !result.needsClarification) {
      // No more questions needed — we can generate
      return res.json({
        needsClarification: false,
        message: 'Все вопросы заданы, можно генерировать агента'
      });
    }

    // Return only the first question (the most important one based on previous answers)
    const nextQuestion = result.questions?.[0] || null;
    if (!nextQuestion) {
      return res.json({
        needsClarification: false,
        message: 'Все вопросы заданы, можно генерировать агента'
      });
    }

    res.json({
      needsClarification: true,
      question: nextQuestion,
      remainingQuestions: result.questions.length - 1,
      reasoning: result.reasoning
    });
  } catch (err) {
    console.error('[AgentGenerate] Next question error:', err.message);
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return res.status(504).json({ error: 'AI-модель не отвечает. Попробуйте снова.' });
    }
    res.status(502).json({ error: 'Ошибка генерации вопроса. Попробуйте позже.' });
  }
});

// Step 2: Generate agent via chat (returns dialog + generated agent)
router.post('/generate', authenticate, generalLimiter, async (req, res) => {
  try {
    const { goal, companyName, industry, answers, messages = [], channel } = req.body;

    if (!goal || typeof goal !== 'string' || goal.trim().length < 3) {
      return res.status(400).json({ error: 'Опишите задачу агента (минимум 3 символа)' });
    }

    const prompt = GENERATION_PROMPT(goal, companyName, industry, answers || {}, messages, channel);
    const response = await callAI(prompt, false);
    const aiText = response.data.choices?.[0]?.message?.content || '';

    // Extract agent JSON from markers
    const agentJson = extractAgentJson(aiText);

    if (agentJson) {
      // Successful generation
      const cleanText = aiText.replace(/---AGENT_JSON---[\s\S]*?---END_JSON---/, '').trim();
      const dialogMessages = cleanText
        .split('\n')
        .filter(line => line.trim().length > 0 && !line.includes('---'))
        .map((line, idx) => ({
          id: `gen-${idx}`,
          role: 'assistant',
          content: line.trim()
        }));

      return res.json({
        generated: {
          ...agentJson,
          confidence: agentJson.confidence || 0.85,
          model: agentJson.model || 'glm-5p1'
        },
        messages: dialogMessages,
        reasoning: 'Агент сгенерирован на основе предоставленной информации'
      });
    }

    // No agent JSON found — AI probably asked more questions or failed
    // Check if there are questions in the response
    const lines = aiText.split('\n').filter(l => l.trim().length > 10);
    const lastLines = lines.slice(-5);
    const hasQuestion = lastLines.some(l => /\?/.test(l));

    if (hasQuestion) {
      return res.json({
        needsClarification: true,
        messages: lines.map((line, idx) => ({
          id: `gen-${idx}`,
          role: 'assistant',
          content: line.trim()
        })),
        reasoning: 'AI требует дополнительных уточнений'
      });
    }

    // Complete fallback
    return res.json({
      generated: buildFallbackAgent(goal, companyName),
      messages: [{ id: 'gen-fallback', role: 'assistant', content: 'Сгенерировал базового агента на основе вашего описания.' }],
      reasoning: 'Базовая генерация — AI не вернул структурированный ответ'
    });
  } catch (err) {
    console.error('[AgentGenerate] Generation error:', err.message);
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return res.status(504).json({ error: 'AI-модель не отвечает. Попробуйте снова.' });
    }
    res.status(502).json({ error: 'Ошибка генерации агента. Попробуйте позже.' });
  }
});

// Step 2b: Streaming generation (SSE)
router.post('/stream', authenticate, generalLimiter, async (req, res) => {
  try {
    const { goal, companyName, industry, answers, messages = [], channel } = req.body;

    if (!goal || typeof goal !== 'string' || goal.trim().length < 3) {
      return res.status(400).json({ error: 'Опишите задачу агента (минимум 3 символа)' });
    }

    const prompt = GENERATION_PROMPT(goal, companyName, industry, answers || {}, messages, channel);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const response = await callAI(prompt, true);
    let fullContent = '';
    let buffer = '';

    const sendEvent = (data) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    };

    sendEvent({ type: 'start' });

    response.data.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              sendEvent({ type: 'chunk', content: delta });
            }
          } catch (parseErr) {
            // ignore malformed stream chunks
          }
        }
      }
    });

    response.data.on('end', () => {
      // Process remaining buffer
      if (buffer) {
        const line = buffer.trim();
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                sendEvent({ type: 'chunk', content: delta });
              }
            } catch (e) { /* ignore */ }
          }
        }
      }

      // Try to extract agent JSON
      const agentJson = extractAgentJson(fullContent);
      if (agentJson) {
        sendEvent({
          type: 'generated',
          generated: {
            ...agentJson,
            confidence: agentJson.confidence || 0.85,
            model: agentJson.model || 'glm-5p1'
          },
          fullContent: fullContent.replace(/---AGENT_JSON---[\s\S]*?---END_JSON---/, '').trim()
        });
      } else {
        // Check if AI asked more questions
        const hasQuestion = fullContent.split('\n').slice(-5).some(l => /\?/.test(l));
        if (hasQuestion) {
          sendEvent({ type: 'needs_clarification', content: fullContent });
        } else {
          // Fallback
          sendEvent({
            type: 'generated',
            generated: buildFallbackAgent(goal, companyName),
            fullContent: fullContent || 'Генерация завершена'
          });
        }
      }
      sendEvent({ type: 'done' });
      res.end();
    });

    response.data.on('error', (err) => {
      console.error('[AgentGenerate] Stream error:', err.message);
      sendEvent({ type: 'error', error: 'Ошибка в потоке генерации' });
      res.end();
    });

    req.on('close', () => {
      if (!res.writableEnded) {
        res.end();
      }
    });
  } catch (err) {
    console.error('[AgentGenerate] Stream setup error:', err.message);
    if (!res.headersSent) {
      if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
        return res.status(504).json({ error: 'AI-модель не отвечает. Попробуйте снова.' });
      }
      res.status(502).json({ error: 'Ошибка генерации агента. Попробуйте позже.' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
      res.end();
    }
  }
});

module.exports = router;
