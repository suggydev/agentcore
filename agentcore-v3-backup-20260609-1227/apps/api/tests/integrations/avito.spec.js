const { AvitoProvider } = require('../../services/providers/avito');

describe('AvitoProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new AvitoProvider();
  });

  describe('initialize', () => {
    it('should initialize with accessToken and userId', async () => {
      const result = await provider.initialize({ accessToken: 'test-token', userId: '12345' });
      expect(result).toBe(true);
      expect(provider.initialized).toBe(true);
    });

    it('should initialize with clientId+clientSecret', async () => {
      const result = await provider.initialize({ clientId: 'id', clientSecret: 'secret', userId: '123' });
      expect(result).toBe(true);
    });

    it('should reject missing userId', async () => {
      await expect(provider.initialize({ accessToken: 'test' })).rejects.toThrow('userId');
    });
  });

  describe('handleWebhook', () => {
    it('should parse message webhook', async () => {
      await provider.initialize({ accessToken: 'test', userId: '123' });
      const result = await provider.handleWebhook({
        type: 'message_received',
        payload: { chat_id: 'chat1', content: { text: 'Hello' }, author_id: 100, direction: 'inbound' }
      });
      expect(result.processed).toBe(true);
      expect(result.chatId).toBe('chat1');
    });
  });

  describe('disconnect', () => {
    it('should clear credentials', async () => {
      await provider.initialize({ accessToken: 'test', userId: '123' });
      const result = await provider.disconnect();
      expect(result).toBe(true);
      expect(provider.initialized).toBe(false);
    });
  });
});
