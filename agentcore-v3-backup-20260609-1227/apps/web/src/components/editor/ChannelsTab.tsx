'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  MessageSquare, Phone, ShoppingCart, Cloud, Mail, Zap, CreditCard, Globe,
  CheckCircle, ArrowRight, ArrowLeft, Loader2, Instagram, Facebook, Calendar, AlertTriangle, BookOpen, PlusCircle
} from 'lucide-react';
import { Button } from '@/design/components/Button';
import { Card } from '@/design/components/Card';
import { Input } from '@/design/components/Input';
import { Modal } from '@/design/components/Modal';
import { StatusBadge } from '@/design/components/StatusBadge';
import { Skeleton } from '@/design/components/Skeleton';
import { useToast } from '@/design/components/Toast';
import { t } from '@/design/i18n';
import type { IntegrationProvider, IntegrationConnection } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface ChannelsTabProps {
  agentId: string;
  token: string;
}

const PROVIDERS: IntegrationProvider[] = [
  // Messengers
  { id: 'telegram', name: 'Telegram', icon: 'MessageSquare', category: 'messengers', status: 'available', description: 'Бот или личный аккаунт в Telegram', features: ['Автоответы 24/7', 'Bot API', 'User MTProto'], authType: 'token', warning: 'Внимание: использование личного аккаунта может привести к временной блокировке со стороны Telegram. Рекомендуем использовать Bot API.', fields: [
    { key: 'mode', label: 'Режим', type: 'select', required: true, options: [{ label: 'Bot API (бот)', value: 'bot' }, { label: 'User MTProto (личный аккаунт)', value: 'user' }], hint: 'Выберите режим подключения' },
    { key: 'botToken', label: 'Bot Token', type: 'text', required: false, placeholder: '123456:ABC-DEF...', hint: 'Получите у @BotFather', showIf: { field: 'mode', value: 'bot' } },
    { key: 'phoneNumber', label: 'Номер телефона', type: 'text', required: false, placeholder: '+79991234567', hint: 'Ваш номер Telegram', showIf: { field: 'mode', value: 'user' } },
    { key: 'code', label: 'Код подтверждения', type: 'text', required: false, placeholder: '12345', hint: 'Придёт в Telegram', showIf: { field: 'mode', value: 'user' } },
    { key: 'password', label: 'Пароль 2FA', type: 'password', required: false, placeholder: '••••••', hint: 'Если включен 2FA', showIf: { field: 'mode', value: 'user' } },
  ]},
  { id: 'whatsapp', name: 'WhatsApp', icon: 'Phone', category: 'messengers', status: 'available', description: 'WhatsApp Business API или WhatsApp Web', features: ['Автоответы', 'Шаблоны сообщений', 'WhatsApp Web QR'], authType: 'token', warning: 'WhatsApp может ограничить или заблокировать номер при массовой рассылке или нарушении правил. Рекомендуем использовать Business API.', fields: [
    { key: 'mode', label: 'Режим', type: 'select', required: true, options: [{ label: 'Cloud API (Meta Business)', value: 'cloud' }, { label: 'Web (QR-код)', value: 'web' }], hint: 'Выберите способ подключения' },
    { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', required: false, placeholder: '1234567890', hint: 'Из Meta Business Account', showIf: { field: 'mode', value: 'cloud' } },
    { key: 'accessToken', label: 'Access Token', type: 'password', required: false, placeholder: 'EAAB...', hint: 'Permanent Token из Meta Business', showIf: { field: 'mode', value: 'cloud' } },
    { key: 'sessionName', label: 'Имя сессии', type: 'text', required: false, placeholder: 'default', hint: 'Имя для сохранения сессии (для QR режима)', showIf: { field: 'mode', value: 'web' } },
  ]},
  { id: 'vk', name: 'VK', icon: 'MessageSquare', category: 'messengers', status: 'available', description: 'Сообщения сообщества или личный аккаунт ВКонтакте', features: ['Автоответы в сообщениях', 'Личные сообщения', 'Комментарии'], authType: 'token', warning: 'VK может ограничить частоту сообщений или заблокировать токен при нарушении правил сообщества.', fields: [
    { key: 'mode', label: 'Режим', type: 'select', required: true, options: [{ label: 'Сообщество (группа)', value: 'group' }, { label: 'Пользователь', value: 'user' }], hint: 'Откуда будут сообщения' },
    { key: 'accessToken', label: 'Access Token', type: 'password', required: true, placeholder: 'vk1.a.xxx...', hint: 'VK Admin API или пользовательский токен' },
    { key: 'groupId', label: 'Group ID', type: 'text', required: false, placeholder: '123456789', hint: 'ID сообщества (для group режима)', showIf: { field: 'mode', value: 'group' } },
  ]},
  { id: 'avito', name: 'Avito', icon: 'ShoppingCart', category: 'messengers', status: 'available', description: 'Ответы на сообщения Avito', features: ['Автоответы', 'Квалификация лидов'], authType: 'token', warning: 'Avito может ограничить доступ к API при нарушении правил использования.', fields: [
    { key: 'clientId', label: 'Client ID', type: 'text', required: true, placeholder: 'xxx', hint: 'Из настроек приложения Avito' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, placeholder: 'xxx', hint: 'Секретный ключ приложения' },
    { key: 'userId', label: 'User ID', type: 'text', required: true, placeholder: '123456', hint: 'Ваш ID пользователя Avito' },
  ]},
  { id: 'yandex-messenger', name: 'Я.Мессенджер', icon: 'MessageSquare', category: 'messengers', status: 'available', description: 'Интеграция с Яндекс Мессенджер', features: ['Автоответы', 'Умные уведомления'], authType: 'token', warning: 'Яндекс может изменить условия API или ограничить доступ.', fields: [
    { key: 'accessToken', label: 'OAuth Token', type: 'password', required: true, placeholder: 'y0_Ag...', hint: 'Токен из Яндекс ID OAuth' },
    { key: 'orgId', label: 'Organization ID', type: 'text', required: true, placeholder: '123456', hint: 'ID организации в Яндекс Мессенджер' },
  ]},
  { id: 'instagram', name: 'Instagram', icon: 'Instagram', category: 'messengers', status: 'available', description: 'Ответы в Instagram Direct', features: ['Автоответы', 'Истории'], authType: 'token', warning: 'Meta может ограничить или заблокировать аккаунт за использование автоматизации. Соблюдайте правила платформы.', fields: [
    { key: 'accessToken', label: 'Access Token', type: 'password', required: true, placeholder: 'EAAB...', hint: 'Instagram Graph API токен' },
    { key: 'businessAccountId', label: 'Business Account ID', type: 'text', required: true, placeholder: '1234567890', hint: 'ID бизнес-аккаунта Instagram' },
    { key: 'appSecret', label: 'App Secret', type: 'password', required: false, placeholder: '••••••', hint: 'Секрет приложения (опционально)' },
  ]},
  { id: 'facebook', name: 'Facebook', icon: 'Facebook', category: 'messengers', status: 'available', description: 'Facebook Messenger для бизнеса', features: ['Автоответы', 'Реклама'], authType: 'token', warning: 'Meta может ограничить или заблокировать страницу за использование автоматизации. Соблюдайте правила платформы.', fields: [
    { key: 'pageAccessToken', label: 'Page Access Token', type: 'password', required: true, placeholder: 'EAAB...', hint: 'Токен доступа к странице' },
    { key: 'pageId', label: 'Page ID', type: 'text', required: false, placeholder: '1234567890', hint: 'ID страницы Facebook' },
    { key: 'appSecret', label: 'App Secret', type: 'password', required: false, placeholder: '••••••', hint: 'Секрет приложения (опционально)' },
  ]},
  { id: 'discord', name: 'Discord', icon: 'MessageSquare', category: 'messengers', status: 'available', description: 'Discord бот и сообщения', features: ['Автоответы', 'Команды'], authType: 'token', warning: 'Discord может ограничить бота при нарушении Terms of Service или чрезмерной активности.', fields: [
    { key: 'botToken', label: 'Bot Token', type: 'password', required: true, placeholder: 'xxx...', hint: 'Токен бота Discord' },
    { key: 'channelId', label: 'Channel ID', type: 'text', required: false, placeholder: '1234567890', hint: 'ID канала (опционально)' },
    { key: 'publicKey', label: 'Public Key', type: 'text', required: false, placeholder: 'xxx...', hint: 'Публичный ключ (опционально)' },
  ]},
  { id: 'viber', name: 'Viber', icon: 'Phone', category: 'messengers', status: 'available', description: 'Viber бот и сообщения', features: ['Автоответы', 'Рассылки'], authType: 'token', warning: 'Viber может ограничить бота при нарушении правил или отправке спама.', fields: [
    { key: 'authToken', label: 'Auth Token', type: 'password', required: true, placeholder: 'xxx...', hint: 'Токен из Viber Admin Panel' },
    { key: 'webhookUrl', label: 'Webhook URL', type: 'text', required: false, placeholder: 'https://...', hint: 'URL для webhook (опционально)' },
  ]},
  { id: 'sms', name: 'SMS.ru', icon: 'MessageSquare', category: 'messengers', status: 'available', description: 'SMS-рассылки через SMS.ru', features: ['SMS-рассылки', 'Уведомления'], authType: 'token', fields: [
    { key: 'apiId', label: 'API ID', type: 'text', required: true, placeholder: 'xxx...', hint: 'API ID из личного кабинета SMS.ru' },
    { key: 'sender', label: 'Sender Name', type: 'text', required: false, placeholder: 'Company', hint: 'Имя отправителя (опционально)' },
  ]},
  // CRM
  { id: 'amocrm', name: 'amoCRM', icon: 'Cloud', category: 'crm', status: 'available', description: 'Синхронизация сделок и контактов', features: ['Создание сделок', 'Обновление контактов', 'Автопиплайн'], authType: 'oauth', authUrl: '/api/integrations/amocrm/auth', fields: [
    { key: 'subdomain', label: 'Поддомен', type: 'text', required: true, placeholder: 'company', hint: 'Ваш поддомен в amoCRM' },
  ]},
  { id: 'bitrix24', name: 'Bitrix24', icon: 'Cloud', category: 'crm', status: 'available', description: 'Интеграция с Bitrix24 CRM', features: ['Лиды', 'Сделки', 'Контакты'], authType: 'oauth', authUrl: '/api/integrations/bitrix24/auth', fields: [
    { key: 'domain', label: 'Домен', type: 'text', required: true, placeholder: 'company.bitrix24.ru', hint: 'Ваш домен Bitrix24' },
  ]},
  { id: '1c', name: '1С', icon: 'Cloud', category: 'crm', status: 'available', description: 'Обмен данными с 1С через веб-сервис', features: ['Номенклатура', 'Заказы', 'Клиенты'], authType: 'token', fields: [
    { key: 'baseUrl', label: 'URL веб-сервиса', type: 'text', required: true, placeholder: 'https://1c.company.ru/erp/odata', hint: 'Путь к OData сервису 1С' },
    { key: 'username', label: 'Логин', type: 'text', required: true, placeholder: 'user', hint: 'Пользователь 1С' },
    { key: 'password', label: 'Пароль', type: 'password', required: true, placeholder: '••••••', hint: 'Пароль пользователя 1С' },
  ]},
  // Email
  { id: 'mailru', name: 'Mail.ru', icon: 'Mail', category: 'email', status: 'available', description: 'Почта Mail.ru для бизнеса', features: ['Входящие', 'Рассылки'], authType: 'token', fields: [
    { key: 'email', label: 'Email', type: 'text', required: true, placeholder: 'agent@company.ru', hint: 'Почтовый ящик' },
    { key: 'password', label: 'App Password', type: 'password', required: true, placeholder: '••••••', hint: 'Пароль приложения Mail.ru' },
    { key: 'imapHost', label: 'IMAP Host', type: 'text', required: false, placeholder: 'imap.mail.ru', hint: 'IMAP сервер (опционально)' },
    { key: 'smtpHost', label: 'SMTP Host', type: 'text', required: false, placeholder: 'smtp.mail.ru', hint: 'SMTP сервер (опционально)' },
  ]},
  { id: 'yandex360', name: 'Я.360', icon: 'Mail', category: 'email', status: 'available', description: 'Почта Яндекс 360 для бизнеса', features: ['Входящие', 'Автоответы', 'Календарь'], authType: 'oauth', authUrl: '/api/integrations/yandex360/auth', fields: [
    { key: 'orgId', label: 'Organization ID', type: 'text', required: true, placeholder: '123456', hint: 'ID организации в Яндекс 360' },
  ]},
  { id: 'unisender', name: 'Unisender', icon: 'Mail', category: 'email', status: 'available', description: 'Email-рассылки', features: ['Рассылки', 'Шаблоны', 'Аналитика'], authType: 'token', fields: [
    { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'xxx...', hint: 'Из личного кабинета Unisender' },
    { key: 'defaultSenderEmail', label: 'Sender Email', type: 'text', required: false, placeholder: 'noreply@company.ru', hint: 'Email отправителя по умолчанию' },
    { key: 'defaultSenderName', label: 'Sender Name', type: 'text', required: false, placeholder: 'Company', hint: 'Имя отправителя по умолчанию' },
  ]},
  // Email (generic SMTP/IMAP)
  { id: 'email', name: 'Email (SMTP/IMAP)', icon: 'Mail', category: 'email', status: 'available', description: 'Подключение любого почтового ящика', features: ['Входящие письма', 'Автоответы', 'Рассылки'], authType: 'token', fields: [
    { key: 'email', label: 'Email', type: 'text', required: true, placeholder: 'agent@company.ru', hint: 'Почтовый ящик' },
    { key: 'password', label: 'App Password', type: 'password', required: true, placeholder: '••••••', hint: 'Пароль приложения или специальный пароль' },
    { key: 'imapHost', label: 'IMAP Host', type: 'text', required: true, placeholder: 'imap.mail.ru', hint: 'Сервер входящей почты' },
    { key: 'imapPort', label: 'IMAP Port', type: 'text', required: false, placeholder: '993', hint: 'Порт IMAP (по умолчанию 993)' },
    { key: 'smtpHost', label: 'SMTP Host', type: 'text', required: true, placeholder: 'smtp.mail.ru', hint: 'Сервер исходящей почты' },
    { key: 'smtpPort', label: 'SMTP Port', type: 'text', required: false, placeholder: '465', hint: 'Порт SMTP (по умолчанию 465)' },
  ]},
  // WebChat
  { id: 'webchat', name: 'WebChat', icon: 'Globe', category: 'messengers', status: 'available', description: 'Виджет чата для вашего сайта', features: ['Чат-виджет', 'Кастомизация', 'Встраивание на сайт'], authType: 'none', fields: [
    { key: 'color', label: 'Цвет виджета', type: 'text', required: false, placeholder: '#6C47FF', hint: 'HEX-код основного цвета' },
    { key: 'position', label: 'Позиция', type: 'select', required: false, options: [{ label: 'Справа внизу', value: 'right' }, { label: 'Слева внизу', value: 'left' }], hint: 'Где показывать кнопку чата' },
    { key: 'title', label: 'Заголовок', type: 'text', required: false, placeholder: 'Чат с поддержкой', hint: 'Заголовок окна чата' },
    { key: 'allowedDomains', label: 'Разрешённые домены', type: 'text', required: false, placeholder: 'example.com, site.ru', hint: 'Через запятую. Оставьте пустым — все домены.' },
  ]},
  // Automation
  { id: 'google-drive', name: 'Google Drive', icon: 'Cloud', category: 'automation', status: 'available', description: 'Документы и файлы', features: ['Чтение документов', 'Знания из файлов'], authType: 'oauth', authUrl: '/api/integrations/gdrive/auth', fields: [
    { key: 'folderId', label: 'Папка (ID)', type: 'text', required: false, placeholder: '1abc...', hint: 'ID папки Google Drive (опционально)' },
  ]},
  { id: 'albato', name: 'Albato', icon: 'Zap', category: 'automation', status: 'available', description: 'No-code автоматизация через webhook', features: ['Триггеры', 'Действия', 'Сценарии'], authType: 'token', fields: [
    { key: 'apiToken', label: 'API Token', type: 'password', required: true, placeholder: 'xxx...', hint: 'API Token из личного кабинета Albato' },
    { key: 'workspaceId', label: 'Workspace ID', type: 'text', required: false, placeholder: 'xxx...', hint: 'ID рабочего пространства (опционально)' },
  ]},
  { id: 'yandex-functions', name: 'Yandex Cloud Functions', icon: 'Zap', category: 'automation', status: 'available', description: 'Serverless функции', features: ['Webhook обработка', 'Кастомная логика'], authType: 'token', fields: [
    { key: 'iamToken', label: 'IAM Token', type: 'password', required: true, placeholder: 't1.9eu...', hint: 'Yandex Cloud IAM токен' },
    { key: 'folderId', label: 'Folder ID', type: 'text', required: true, placeholder: 'b1g...', hint: 'ID каталога в Yandex Cloud' },
  ]},
  { id: 'webhooks', name: 'Webhooks', icon: 'Zap', category: 'automation', status: 'available', description: 'Произвольные HTTP-вебхуки', features: ['Исходящие', 'Входящие', 'Настраиваемые схемы'], authType: 'token', fields: [
    { key: 'secret', label: 'Секретный ключ', type: 'password', required: true, placeholder: 'whsec_...', hint: 'Для проверки подписи webhook' },
    { key: 'targetUrl', label: 'Целевой URL', type: 'text', required: false, placeholder: 'https://...', hint: 'Куда отправлять исходящие' },
  ]},
  { id: 'yandexcalendar', name: 'Яндекс Календарь', icon: 'Calendar', category: 'automation', status: 'available', description: 'Синхронизация с Яндекс Календарем', features: ['События', 'Напоминания'], authType: 'token', fields: [
    { key: 'clientId', label: 'Client ID', type: 'text', required: false, placeholder: 'xxx...', hint: 'ID приложения (опционально)' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', required: false, placeholder: '••••••', hint: 'Секрет приложения (опционально)' },
    { key: 'accessToken', label: 'Access Token', type: 'password', required: false, placeholder: 'y0_Ag...', hint: 'OAuth токен (опционально)' },
    { key: 'refreshToken', label: 'Refresh Token', type: 'password', required: false, placeholder: 'xxx...', hint: 'Refresh токен (опционально)' },
    { key: 'defaultCalendarId', label: 'Calendar ID', type: 'text', required: false, placeholder: 'xxx...', hint: 'ID календаря по умолчанию (опционально)' },
  ]},
  { id: 'tbank', name: 'Т-Банк', icon: 'CreditCard', category: 'automation', status: 'available', description: 'Интеграция с Т-Банк Бизнес', features: ['Платежи', 'Счета'], authType: 'token', fields: [
    { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'xxx...', hint: 'API Key из личного кабинета Т-Банк' },
    { key: 'accountNumber', label: 'Account Number', type: 'text', required: false, placeholder: '1234567890', hint: 'Номер счета (опционально)' },
    { key: 'defaultCompanyInn', label: 'Company INN', type: 'text', required: false, placeholder: '1234567890', hint: 'ИНН компании (опционально)' },
  ]},
  // Payments
  { id: 'yookassa', name: 'ЮKassa', icon: 'CreditCard', category: 'payments', status: 'available', description: 'Приём платежей через ЮKassa', features: ['Оплата', 'Возвраты', 'Подписки'], authType: 'token', fields: [
    { key: 'shopId', label: 'Shop ID', type: 'text', required: true, placeholder: '123456', hint: 'ID магазина в ЮKassa' },
    { key: 'secretKey', label: 'Secret Key', type: 'password', required: true, placeholder: 'live_...', hint: 'Секретный ключ из личного кабинета' },
  ]},
  { id: 'tinkoff', name: 'Тинькофф', icon: 'CreditCard', category: 'payments', status: 'available', description: 'Тинькофф эквайринг', features: ['Оплата', 'Рассрочки'], authType: 'token', fields: [
    { key: 'terminalKey', label: 'Terminal Key', type: 'text', required: true, placeholder: '12345678', hint: 'Ключ терминала' },
    { key: 'secretKey', label: 'Secret Key', type: 'password', required: true, placeholder: '••••••', hint: 'Пароль из личного кабинета Тинькофф' },
  ]},
  { id: 'robokassa', name: 'Robokassa', icon: 'CreditCard', category: 'payments', status: 'available', description: 'Приём платежей через Robokassa', features: ['Оплата', 'Подписки'], authType: 'token', fields: [
    { key: 'merchantLogin', label: 'Merchant Login', type: 'text', required: true, placeholder: 'company', hint: 'Логин мерчанта в Robokassa' },
    { key: 'password1', label: 'Password #1', type: 'password', required: true, placeholder: '••••••', hint: 'Пароль #1 из личного кабинета' },
    { key: 'password2', label: 'Password #2', type: 'password', required: true, placeholder: '••••••', hint: 'Пароль #2 из личного кабинета' },
    { key: 'isTest', label: 'Test Mode', type: 'select', required: false, options: [{ label: 'Да', value: 'true' }, { label: 'Нет', value: 'false' }], hint: 'Тестовый режим' },
  ]},
  { id: 'sbp', name: 'СБП', icon: 'CreditCard', category: 'payments', status: 'available', description: 'Система быстрых платежей', features: ['P2P переводы', 'QR-оплата'], authType: 'token', fields: [
    { key: 'merchantId', label: 'Merchant ID', type: 'text', required: true, placeholder: '123456', hint: 'ID мерчанта в СБП' },
    { key: 'apiToken', label: 'API Token', type: 'password', required: true, placeholder: '••••••', hint: 'Токен из банка-партнёра' },
  ]},
];

const CATEGORY_ORDER: IntegrationProvider['category'][] = ['messengers', 'crm', 'email', 'automation', 'payments'];

const iconMap: Record<string, typeof MessageSquare> = {
  MessageSquare, Phone, ShoppingCart, Cloud, Mail, Zap, CreditCard, Globe,
};

export default function ChannelsTab({ agentId, token }: ChannelsTabProps) {
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectModal, setConnectModal] = useState<IntegrationProvider | null>(null);
  const [connectStep, setConnectStep] = useState(0);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [connecting, setConnecting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'fail'>('idle');
  const [telegraphGuideUrl, setTelegraphGuideUrl] = useState<string | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestText, setRequestText] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const { addToast } = useToast();

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/integrations?agentId=${agentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConnections(Array.isArray(data) ? data : data.connections ?? []);
      } else {
        addToast({ variant: 'error', message: t('toast.error') });
      }
    } catch (err) {
      console.error('[ChannelsTab]', err);
      addToast({ variant: 'error', message: t('toast.error') });
    }
    setLoading(false);
  }, [agentId, token, addToast]);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  useEffect(() => {
    if (!connectModal) {
      setTelegraphGuideUrl(null);
      return;
    }
    setGuideLoading(true);
    fetch(`${API_BASE}/api/integrations/telegraph-guide/${connectModal.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => setTelegraphGuideUrl(data?.url || null))
      .catch(() => setTelegraphGuideUrl(null))
      .finally(() => setGuideLoading(false));
  }, [connectModal, token]);

  const getConnection = useCallback((providerId: string) => {
    return connections.find((c) => c.providerId === providerId);
  }, [connections]);

  const handleConnect = useCallback(async () => {
    if (!connectModal) return;
    setConnecting(true);
    try {
      // Фильтруем только видимые поля (с учётом showIf)
      const visibleFields = connectModal.fields?.filter((field) => {
        if (!field.showIf) return true;
        return fieldValues[field.showIf.field] === field.showIf.value;
      }) ?? [];
      const visibleKeys = new Set(visibleFields.map((f) => f.key));
      const filteredValues: Record<string, string> = {};
      Object.entries(fieldValues).forEach(([k, v]) => {
        if (visibleKeys.has(k)) filteredValues[k] = v;
      });
      const { mode, ...credentials } = filteredValues;
      
      // Special handling for Telegram MTProto (user mode)
      let res;
      if (connectModal.id === 'telegram' && mode === 'user') {
        res = await fetch(`${API_BASE}/api/channels/telegram/mtproto-connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ 
            phoneNumber: credentials.phoneNumber, 
            code: credentials.code, 
            password: credentials.password 
          }),
        });
      } else {
        res = await fetch(`${API_BASE}/api/integrations/${connectModal.id}/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ agentId, mode: mode || undefined, credentials }),
        });
      }
      if (res.ok) {
        addToast({ variant: 'success', message: t('toast.success') });
        fetchConnections();
        setConnectStep(2);
      } else {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
        addToast({ variant: 'error', message: errData.error || t('toast.error') });
      }
    } catch {
      addToast({ variant: 'error', message: t('toast.error') });
    }
    setConnecting(false);
  }, [connectModal, agentId, token, fieldValues, addToast, fetchConnections]);

  const handleDisconnect = useCallback(async (providerId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/integrations/${providerId}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ agentId }),
      });
      if (res.ok) {
        setConnections((prev) => prev.filter((c) => c.providerId !== providerId));
        addToast({ variant: 'success', message: t('toast.success') });
      } else {
        addToast({ variant: 'error', message: t('toast.error') });
      }
    } catch (err) {
      console.error('[ChannelsTab] handleDisconnect:', err);
      addToast({ variant: 'error', message: t('toast.error') });
    }
  }, [token, agentId, addToast]);

  const handleTest = useCallback(async () => {
    setTestResult('idle');
    try {
      const res = await fetch(`${API_BASE}/api/integrations/${connectModal?.id}/test-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ agentId, message: 'Тестовое сообщение от AgentCore' }),
      });
      setTestResult(res.ok ? 'success' : 'fail');
    } catch {
      setTestResult('fail');
    }
  }, [connectModal, agentId, token]);

  const closeModal = useCallback(() => {
    setConnectModal(null);
    setConnectStep(0);
    setFieldValues({});
    setTestResult('idle');
  }, []);

  if (loading) {
    return <div className="p-5"><Skeleton variant="card" /><Skeleton variant="card" /></div>;
  }

  return (
    <div className="p-5 flex flex-col gap-6">
      <h2 className="text-[20px] font-semibold text-[var(--text)]">{t('channels.title')}</h2>

      {CATEGORY_ORDER.map((cat) => {
        const providers = PROVIDERS.filter((p) => p.category === cat);
        if (providers.length === 0) return null;

        return (
          <div key={cat}>
            <h3 className="text-[14px] font-medium text-[var(--text-muted)] mb-3">
              {t(`channels.categories.${cat}`)}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {providers.map((provider) => {
                const conn = getConnection(provider.id);
                const Icon = iconMap[provider.icon] || MessageSquare;
                return (
                  <Card key={provider.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[var(--radius-button)] bg-[var(--accent-soft)] flex items-center justify-center flex-shrink-0">
                      <Icon size={18} className="text-[var(--brand)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-[var(--text)]">{provider.name}</p>
                      {conn ? (
                        <StatusBadge variant="active" label={t('channels.connected')} />
                      ) : (
                        <Button
                          variant="pill"
                          size="sm"
                          onClick={() => { setConnectModal(provider); setConnectStep(0); }}
                          aria-label={`${t('channels.connect')} ${provider.name}`}
                        >
                          {t('channels.connect')}
                        </Button>
                      )}
                    </div>
                    {conn && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setConnectModal(provider); setConnectStep(2); }} aria-label={t('channels.configure')}>
                          {t('channels.configure')}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDisconnect(provider.id)} aria-label={t('channels.disconnect')}>
                          {t('channels.disconnect')}
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="mt-4 p-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)]">
        <p className="text-[13px] text-[var(--text-muted)] mb-2">Не нашли нужный канал?</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRequestModalOpen(true)}
          className="text-[var(--brand)]"
        >
          <PlusCircle size={14} className="mr-1.5" />
          Попросить интеграцию
        </Button>
      </div>

      <Modal
        open={connectModal !== null}
        onClose={closeModal}
        title={`${t('channels.connectModal.title')} ${connectModal?.name ?? ''}`}
        size="md"
      >
        {connectModal && (
          <div className="flex flex-col gap-4">
            {connectStep === 0 && (
              <>
                <p className="text-[14px] text-[var(--text)]">{connectModal.description}</p>
                <ul className="flex flex-col gap-1.5">
                  {connectModal.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[14px] text-[var(--text)]">
                      <CheckCircle size={14} className="text-[var(--success)]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant="primary" onClick={() => setConnectStep(1)} aria-label={t('common.next')}>
                  {t('common.next')}
                  <ArrowRight size={14} />
                </Button>
              </>
            )}
            {connectStep === 1 && (
              <>
                {connectModal.authType === 'oauth' && connectModal.authUrl && (
                  <a
                    href={`${API_BASE}${connectModal.authUrl}?agentId=${agentId}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[var(--radius-button)] bg-[var(--brand)] text-white font-medium text-[14px] hover:opacity-90 transition-opacity"
                    aria-label="OAuth"
                  >
                    {t('channels.connectModal.stepAuth')}
                  </a>
                )}
                {connectModal.authType === 'token' && connectModal.fields && (
                  <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
                    {connectModal.warning && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-xs">
                        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                        <span>{connectModal.warning}</span>
                      </div>
                    )}
                    {telegraphGuideUrl && (
                      <a
                        href={telegraphGuideUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 rounded-lg bg-brand/5 border border-brand/10 text-brand text-xs hover:bg-brand/10 transition-colors"
                      >
                        <BookOpen size={14} className="flex-shrink-0" />
                        <span>Инструкция по подключению (Telegra.ph)</span>
                      </a>
                    )}
                    {connectModal.fields.filter((field) => {
                      if (!field.showIf) return true;
                      return fieldValues[field.showIf.field] === field.showIf.value;
                    }).map((field) => (
                      <div key={field.key} className="flex flex-col gap-1">
                        <label className="text-[13px] font-medium text-[var(--text)]">
                          {field.label}
                          {field.required && <span className="text-[var(--danger)] ml-0.5">*</span>}
                        </label>
                        {field.type === 'select' && field.options ? (
                          <select
                            value={fieldValues[field.key] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFieldValues(prev => {
                                const next = { ...prev, [field.key]: val };
                                // Очищаем поля, которые скрываются при новом значении
                                connectModal?.fields?.forEach((f) => {
                                  if (f.showIf && f.showIf.field === field.key && f.showIf.value !== val) {
                                    delete next[f.key];
                                  }
                                });
                                return next;
                              });
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-surface text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-brand/30"
                          >
                            <option value="">{field.placeholder || 'Выберите...'}</option>
                            {field.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            type={field.type === 'password' ? 'password' : 'text'}
                            placeholder={field.placeholder || field.label}
                            value={fieldValues[field.key] || ''}
                            onChange={(e) => setFieldValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                            aria-label={field.label}
                          />
                        )}
                        {field.hint && <p className="text-[11px] text-[var(--text-muted)]">{field.hint}</p>}
                      </div>
                    ))}
                    <Button variant="primary" onClick={handleConnect} loading={connecting} aria-label={t('channels.connect')}>
                      {t('channels.connect')}
                    </Button>
                  </div>
                )}
                {connectModal.authType === 'none' && (
                  <Button variant="primary" onClick={handleConnect} loading={connecting} aria-label={t('channels.connect')}>
                    {t('channels.connect')}
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setConnectStep(0)} aria-label={t('common.back')}>
                  <ArrowLeft size={14} />
                  {t('common.back')}
                </Button>
              </>
            )}
            {connectStep === 2 && (
              <>
                <Button variant="secondary" onClick={handleTest} aria-label={t('channels.test')}>
                  {t('channels.connectModal.testMessage')}
                </Button>
                {testResult === 'success' && (
                  <p className="text-[14px] text-[var(--success)]">{t('channels.connectModal.testSuccess')}</p>
                )}
                {testResult === 'fail' && (
                  <p className="text-[14px] text-[var(--danger)]">{t('channels.connectModal.testFail')}</p>
                )}
                <Button variant="primary" onClick={closeModal} aria-label={t('common.close')}>
                  {t('common.close')}
                </Button>
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={requestModalOpen}
        onClose={() => { setRequestModalOpen(false); setRequestText(''); }}
        title="Попросить интеграцию"
      >
        <div className="flex flex-col gap-3">
          <p className="text-[14px] text-[var(--text-muted)]">
            Опишите, какой канал или интеграцию вы хотите видеть. Запрос отправится в админку.
          </p>
          <textarea
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            placeholder="Например: подключение к Slack, интеграция с amoCRM..."
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-surface text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-brand/30 min-h-[100px] resize-y"
          />
          <Button
            variant="primary"
            loading={requestSubmitting}
            disabled={!requestText.trim()}
            onClick={async () => {
              setRequestSubmitting(true);
              try {
                const res = await fetch(`${API_BASE}/api/integrations/request`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ text: requestText.trim() })
                });
                if (res.ok) {
                  addToast({ variant: 'success', message: 'Запрос отправлен! Мы рассмотрим его в ближайшее время.' });
                  setRequestModalOpen(false);
                  setRequestText('');
                } else {
                  const err = await res.json().catch(() => ({}));
                  addToast({ variant: 'error', message: err.error || 'Не удалось отправить запрос' });
                }
              } catch {
                addToast({ variant: 'error', message: 'Не удалось отправить запрос' });
              }
              setRequestSubmitting(false);
            }}
          >
            Отправить запрос
          </Button>
        </div>
      </Modal>
    </div>
  );
}
