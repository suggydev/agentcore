const express = require('express');
const axios = require('axios');
const { authenticate } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');
const config = require('../config');

const router = express.Router();

// Generate agent system prompt via real AI
router.post('/generate', authenticate, generalLimiter, async (req, res) => {
  try {
    const { goal, companyName, industry, previousAnswers } = req.body;

    if (!goal || typeof goal !== 'string' || goal.trim().length < 3) {
      return res.status(400).json({ error: 'Опишите задачу агента (минимум 3 символа)' });
    }

    // Step 1: Check if we need clarification questions
    const clarificationPrompt = `Ты — эксперт по созданию AI-агентов для бизнеса.

Задача пользователя: "${goal.trim()}"
Компания: "${companyName || 'Неизвестно'}"
Отрасть: "${industry || 'Неизвестно'}"
${previousAnswers ? `Предыдущие уточнения:\n${JSON.stringify(previousAnswers, null, 2)}` : ''}

Проанализируй описание. Есть ли НЕОДНОЗНАЧНОСТИ, которые нужно уточнить, чтобы создать ИДЕАЛЬНОГО агента?

Если нужны уточнения — верни JSON:
{
  "needsClarification": true,
  "questions": [
    {
      "id": "question1",
      "question": "Конкретный вопрос для уточнения",
      "options": ["Вариант 1", "Вариант 2", "Свой вариант"],
      "type": "single_choice"
    }
  ],
  "reasoning": "Почему нужно уточнить (1-2 предложения)"
}

Если достаточно информации — верни:
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

Важно: отвечай ТОЛЬКО JSON, без markdown, без пояснений.`;

    const response = await axios.post(`${config.SUGGY_BASE_URL}/chat/completions`, {
      model: 'accounts/fireworks/models/glm-5p1',
      messages: [{ role: 'user', content: clarificationPrompt }],
      temperature: 0.3,
      max_tokens: 2000
    }, {
      headers: {
        Authorization: `Bearer ${config.SUGGY_PROJECT_KEY}`,
        'X-Account-Id': config.SUGGY_ACCOUNT_ID,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const aiText = response.data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from AI response
    let result;
    try {
      // Try to extract JSON from response (AI might wrap in markdown)
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseErr) {
      console.error('[AgentGenerate] Failed to parse AI response:', aiText.substring(0, 500));
      // Fallback: generate basic prompt
      result = {
        needsClarification: false,
        generated: {
          name: goal.slice(0, 30) + (goal.length > 30 ? '...' : ''),
          emoji: '🤖',
          systemPrompt: `# РОЛЬ\nТы — AI-ассистент для компании "${companyName || 'Компания'}".\n\n# ЗАДАЧА\n${goal}\n\n# ПРАВИЛА\n- Общайся вежливо и профессионально\n- Отвечай на вопросы клиентов\n- Если не знаешь ответ — предложи связаться с оператором\n- Не раскрывай, что ты ИИ или бот\n\n# КОНТЕКСТ\nКомпания: ${companyName || 'Компания'}`,
          description: goal,
          model: 'glm-5p1',
          brainNodes: ['greeting', 'faq', 'escalation'],
          confidence: 0.6
        },
        reasoning: 'Базовая генерация из-за ошибки парсинга AI-ответа'
      };
    }

    res.json(result);
  } catch (err) {
    console.error('[AgentGenerate] Error:', err.message);
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return res.status(504).json({ error: 'AI-модель не отвечает. Попробуйте снова.' });
    }
    res.status(502).json({ error: 'Ошибка генерации агента. Попробуйте позже.' });
  }
});

module.exports = router;
