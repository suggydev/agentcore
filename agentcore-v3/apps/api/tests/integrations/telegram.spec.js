const { TelegramProvider } = require('../../services/providers/telegram');
const { createMockProvider, mockAxiosSuccess, mockAxiosError, encryption } = require('./setup');

describe('TelegramProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new TelegramProvider();
  });

  describe('initialize', () => {
    it('should initialize with valid botToken', async () => {
      const result = await provider.initialize({ botToken: '123456:ABC-DEF' });
      expect(result).toBe(true);
      expect(provider.initialized).toBe(true);
      expect(provider.botToken).toBe('123456:ABC-DEF');
    });

    it('should reject empty credentials', async () => {
      await expect(provider.initialize(null)).rejects.toThrow();
    });

    it('should reject missing botToken', async () => {
      await expect(provider.initialize({})).rejects.toThrow('botToken');
    });
  });

  describe('healthCheck', () => {
    it('should return ok when getMe succeeds', async () => {
      await provider.initialize({ botToken: 'test-token' });
      provider.execute = jest.fn().mockResolvedValue({ ok: true, result: { id: 123 } });
      const result = await provider.healthCheck();
      expect(result.ok).toBe(true);
      expect(result.latency).toBeDefined();
    });

    it('should return not ok when getMe fails', async () => {
      await provider.initialize({ botToken: 'test-token' });
      provider.execute = jest.fn().mockRejectedValue(new Error('API error'));
      const result = await provider.healthCheck();
      expect(result.ok).toBe(false);
    });
  });

  describe('handleWebhook', () => {
    it('should parse message webhook', async () => {
      await provider.initialize({ botToken: 'test-token' });
      const result = await provider.handleWebhook({
        message: { chat: { id: 12345 }, text: 'Hello', from: { username: 'user1' } }
      });
      expect(result.processed).toBe(true);
      expect(result.chatId).toBe(12345);
      expect(result.text).toBe('Hello');
    });

    it('should return processed false for empty payload', async () => {
      await provider.initialize({ botToken: 'test-token' });
      const result = await provider.handleWebhook({});
      expect(result.processed).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should clear credentials and set uninitialized', async () => {
      await provider.initialize({ botToken: 'test-token' });
      provider.deleteWebhook = jest.fn().mockResolvedValue({ ok: true });
      const result = await provider.disconnect();
      expect(result).toBe(true);
      expect(provider.initialized).toBe(false);
      expect(provider.botToken).toBeNull();
    });
  });
});

describe('Encryption', () => {
  it('should encrypt and decrypt credentials', () => {
    const original = JSON.stringify({ botToken: 'secret-token-123' });
    const encrypted = encryption.encrypt(original);
    const decrypted = encryption.decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('should produce different ciphertext each time', () => {
    const text = 'same-text';
    const enc1 = encryption.encrypt(text);
    const enc2 = encryption.encrypt(text);
    expect(enc1).not.toBe(enc2);
  });

  it('should hash secrets consistently', () => {
    const hash1 = encryption.hashSecret('test-secret');
    const hash2 = encryption.hashSecret('test-secret');
    expect(hash1).toBe(hash2);
  });

  it('should verify valid HMAC', () => {
    const crypto = require('crypto');
    const secret = 'test-secret';
    const payload = JSON.stringify({ test: true });
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    expect(encryption.verifyHmac(payload, signature, secret)).toBe(true);
  });

  it('should reject invalid HMAC', () => {
    expect(encryption.verifyHmac('payload', 'invalid', 'secret')).toBe(false);
  });
});
