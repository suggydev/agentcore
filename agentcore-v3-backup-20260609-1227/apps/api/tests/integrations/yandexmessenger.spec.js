const { YandexMessengerProvider } = require('../../services/providers/yandexmessenger');

describe('YandexMessengerProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new YandexMessengerProvider();
  });

  describe('initialize', () => {
    it('should initialize with accessToken and orgId', async () => {
      const result = await provider.initialize({ accessToken: 'test-token', orgId: '12345' });
      expect(result).toBe(true);
      expect(provider.initialized).toBe(true);
    });

    it('should reject missing orgId', async () => {
      await expect(provider.initialize({ accessToken: 'test' })).rejects.toThrow('orgId');
    });

    it('should accept clientId+clientSecret', async () => {
      const result = await provider.initialize({ clientId: 'id', clientSecret: 'secret', orgId: '123' });
      expect(result).toBe(true);
    });
  });

  describe('handleWebhook', () => {
    it('should parse message webhook', async () => {
      await provider.initialize({ accessToken: 'test', orgId: '123' });
      const result = await provider.handleWebhook({
        chat_id: 'chat1',
        text: 'Hello',
        from_uid: 'user1',
        event: 'message_new'
      });
      expect(result.processed).toBe(true);
      expect(result.text).toBe('Hello');
    });
  });

  describe('disconnect', () => {
    it('should clear state', async () => {
      await provider.initialize({ accessToken: 'test', orgId: '123' });
      const result = await provider.disconnect();
      expect(result).toBe(true);
      expect(provider.initialized).toBe(false);
    });
  });
});
