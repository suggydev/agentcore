import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Сохраняем оригинальное окружение
const originalEnv = process.env;

describe('config', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Минимально необходимые переменные для прохождения валидации
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getConfig', () => {
    it('should return valid config with required env vars', () => {
      const { getConfig } = require('@/lib/config');
      const config = getConfig();

      expect(config.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/testdb');
      expect(config.NODE_ENV).toBe('development');
    });

    it('should apply default values for optional fields', () => {
      const { getConfig } = require('@/lib/config');
      const config = getConfig();

      expect(config.PORT).toBe(3000);
      expect(config.HOST).toBe('0.0.0.0');
      expect(config.ADMIN_PASSWORD).toBe('agentcore2026');
      expect(config.RATE_LIMIT_WINDOW_MS).toBe(15 * 60 * 1000);
      expect(config.RATE_LIMIT_MAX_REQUESTS).toBe(100);
      expect(config.DB_POOL_MAX).toBe(20);
      expect(config.DB_POOL_IDLE_TIMEOUT_MS).toBe(30_000);
      expect(config.DB_POOL_CONNECTION_TIMEOUT_MS).toBe(10_000);
      expect(config.DB_QUERY_TIMEOUT_MS).toBe(30_000);
      expect(config.DB_SLOW_QUERY_THRESHOLD_MS).toBe(100);
    });

    it('should throw when DATABASE_URL is missing', () => {
      delete process.env.DATABASE_URL;
      const { getConfig } = require('@/lib/config');

      expect(() => getConfig()).toThrow('Environment validation failed');
    });

    it('should throw when DATABASE_URL is not a valid URL', () => {
      process.env.DATABASE_URL = 'not-a-url';
      const { getConfig } = require('@/lib/config');

      expect(() => getConfig()).toThrow('Environment validation failed');
    });

    it('should accept valid PostgreSQL connection string as DATABASE_URL', () => {
      process.env.DATABASE_URL = 'postgresql://admin:secret@db.example.com:5432/mydb?sslmode=require';
      const { getConfig } = require('@/lib/config');
      const config = getConfig();

      expect(config.DATABASE_URL).toBe('postgresql://admin:secret@db.example.com:5432/mydb?sslmode=require');
    });

    it('should throw when NODE_ENV is invalid', () => {
      process.env.NODE_ENV = 'invalid';
      const { getConfig } = require('@/lib/config');

      expect(() => getConfig()).toThrow('Environment validation failed');
    });

    it('should accept all valid NODE_ENV values', () => {
      const envs = ['development', 'staging', 'production'] as const;

      for (const env of envs) {
        process.env.NODE_ENV = env;
        jest.resetModules();
        const { getConfig } = require('@/lib/config');
        const config = getConfig();
        expect(config.NODE_ENV).toBe(env);
      }
    });

    it('should throw when JWT_SECRET is less than 32 characters', () => {
      process.env.JWT_SECRET = 'short';
      const { getConfig } = require('@/lib/config');

      expect(() => getConfig()).toThrow('Environment validation failed');
    });

    it('should accept JWT_SECRET with 32 or more characters', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      const { getConfig } = require('@/lib/config');
      const config = getConfig();

      expect(config.JWT_SECRET).toBe('a'.repeat(32));
    });

    it('should throw when ADMIN_PASSWORD is less than 8 characters', () => {
      process.env.ADMIN_PASSWORD = 'short';
      const { getConfig } = require('@/lib/config');

      expect(() => getConfig()).toThrow('Environment validation failed');
    });

    it('should accept ADMIN_PASSWORD with 8 or more characters', () => {
      process.env.ADMIN_PASSWORD = 'longpassword';
      const { getConfig } = require('@/lib/config');
      const config = getConfig();

      expect(config.ADMIN_PASSWORD).toBe('longpassword');
    });

    it('should throw when AGENTCORE_ENCRYPTION_KEY is less than 16 characters', () => {
      process.env.AGENTCORE_ENCRYPTION_KEY = 'short';
      const { getConfig } = require('@/lib/config');

      expect(() => getConfig()).toThrow('Environment validation failed');
    });

    it('should accept AGENTCORE_ENCRYPTION_KEY with 16 or more characters', () => {
      process.env.AGENTCORE_ENCRYPTION_KEY = 'a'.repeat(16);
      const { getConfig } = require('@/lib/config');
      const config = getConfig();

      expect(config.AGENTCORE_ENCRYPTION_KEY).toBe('a'.repeat(16));
    });

    it('should coerce PORT from string to number', () => {
      process.env.PORT = '8080';
      const { getConfig } = require('@/lib/config');
      const config = getConfig();

      expect(config.PORT).toBe(8080);
      expect(typeof config.PORT).toBe('number');
    });

    it('should throw when DB_POOL_MAX exceeds 100', () => {
      process.env.DB_POOL_MAX = '101';
      const { getConfig } = require('@/lib/config');

      expect(() => getConfig()).toThrow('Environment validation failed');
    });

    it('should throw when DB_POOL_MAX is less than 1', () => {
      process.env.DB_POOL_MAX = '0';
      const { getConfig } = require('@/lib/config');

      expect(() => getConfig()).toThrow('Environment validation failed');
    });

    it('should accept DB_POOL_MAX between 1 and 100', () => {
      process.env.DB_POOL_MAX = '50';
      const { getConfig } = require('@/lib/config');
      const config = getConfig();

      expect(config.DB_POOL_MAX).toBe(50);
    });

    it('should accept valid SUPABASE_URL', () => {
      process.env.SUPABASE_URL = 'https://example.supabase.co';
      const { getConfig } = require('@/lib/config');
      const config = getConfig();

      expect(config.SUPABASE_URL).toBe('https://example.supabase.co');
    });

    it('should throw when SUPABASE_URL is not a valid URL', () => {
      process.env.SUPABASE_URL = 'not-a-url';
      const { getConfig } = require('@/lib/config');

      expect(() => getConfig()).toThrow('Environment validation failed');
    });

    it('should return cached config on subsequent calls', () => {
      const { getConfig } = require('@/lib/config');
      const config1 = getConfig();
      const config2 = getConfig();

      expect(config1).toBe(config2);
    });

    it('should include all optional integration keys when set', () => {
      process.env.OPENAI_API_KEY = 'sk-test-openai';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
      process.env.RESEND_API_KEY = 're_test';
      process.env.SLACK_CLIENT_ID = 'slack-id';
      process.env.SLACK_CLIENT_SECRET = 'slack-secret';
      process.env.SLACK_SIGNING_SECRET = 'slack-signing';
      process.env.TWILIO_ACCOUNT_SID = 'ACtest';
      process.env.TWILIO_AUTH_TOKEN = 'twilio-token';
      process.env.LOVABLE_AI_GATEWAY_KEY = 'lovable-key';
      process.env.YOOKASSA_SHOP_ID = 'shop123';
      process.env.YOOKASSA_SECRET_KEY = 'secret123';

      const { getConfig } = require('@/lib/config');
      const config = getConfig();

      expect(config.OPENAI_API_KEY).toBe('sk-test-openai');
      expect(config.ANTHROPIC_API_KEY).toBe('sk-ant-test');
      expect(config.RESEND_API_KEY).toBe('re_test');
      expect(config.SLACK_CLIENT_ID).toBe('slack-id');
      expect(config.SLACK_CLIENT_SECRET).toBe('slack-secret');
      expect(config.SLACK_SIGNING_SECRET).toBe('slack-signing');
      expect(config.TWILIO_ACCOUNT_SID).toBe('ACtest');
      expect(config.TWILIO_AUTH_TOKEN).toBe('twilio-token');
      expect(config.LOVABLE_AI_GATEWAY_KEY).toBe('lovable-key');
      expect(config.YOOKASSA_SHOP_ID).toBe('shop123');
      expect(config.YOOKASSA_SECRET_KEY).toBe('secret123');
    });

    it('should format validation errors with field names', () => {
      delete process.env.DATABASE_URL;
      process.env.NODE_ENV = 'invalid';

      const { getConfig } = require('@/lib/config');

      try {
        getConfig();
        fail('Expected getConfig to throw');
      } catch (err: any) {
        expect(err.message).toContain('Environment validation failed');
        expect(err.message).toContain('DATABASE_URL');
        expect(err.message).toContain('NODE_ENV');
      }
    });
  });

  describe('isProduction', () => {
    it('should return true when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      jest.resetModules();
      const { isProduction } = require('@/lib/config');

      expect(isProduction()).toBe(true);
    });

    it('should return false when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      jest.resetModules();
      const { isProduction } = require('@/lib/config');

      expect(isProduction()).toBe(false);
    });

    it('should return false when NODE_ENV is staging', () => {
      process.env.NODE_ENV = 'staging';
      jest.resetModules();
      const { isProduction } = require('@/lib/config');

      expect(isProduction()).toBe(false);
    });
  });

  describe('isDevelopment', () => {
    it('should return true when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      jest.resetModules();
      const { isDevelopment } = require('@/lib/config');

      expect(isDevelopment()).toBe(true);
    });

    it('should return false when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      jest.resetModules();
      const { isDevelopment } = require('@/lib/config');

      expect(isDevelopment()).toBe(false);
    });

    it('should return false when NODE_ENV is staging', () => {
      process.env.NODE_ENV = 'staging';
      jest.resetModules();
      const { isDevelopment } = require('@/lib/config');

      expect(isDevelopment()).toBe(false);
    });
  });

  describe('getJwtSecret', () => {
    it('should return JWT_SECRET when set', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      jest.resetModules();
      const { getJwtSecret } = require('@/lib/config');

      expect(getJwtSecret()).toBe('a'.repeat(32));
    });

    it('should fall back to AGENTCORE_ENCRYPTION_KEY when JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;
      process.env.AGENTCORE_ENCRYPTION_KEY = 'encryption-key-16ch';
      jest.resetModules();
      const { getJwtSecret } = require('@/lib/config');

      expect(getJwtSecret()).toBe('encryption-key-16ch');
    });

    it('should throw when neither JWT_SECRET nor AGENTCORE_ENCRYPTION_KEY is set', () => {
      delete process.env.JWT_SECRET;
      delete process.env.AGENTCORE_ENCRYPTION_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      jest.resetModules();
      const { getJwtSecret } = require('@/lib/config');

      expect(() => getJwtSecret()).toThrow();
    });
  });
});
