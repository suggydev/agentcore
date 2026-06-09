const { UnisenderProvider } = require('../../services/providers/unisender');

describe('UnisenderProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new UnisenderProvider();
  });

  describe('initialize', () => {
    it('should initialize with valid apiKey', async () => {
      const result = await provider.initialize({ apiKey: 'test-api-key-12345' });
      expect(result).toBe(true);
      expect(provider.initialized).toBe(true);
    });

    it('should reject missing apiKey', async () => {
      await expect(provider.initialize({})).rejects.toThrow('apiKey');
    });

    it('should reject short apiKey', async () => {
      await expect(provider.initialize({ apiKey: 'short' })).rejects.toThrow('apiKey');
    });
  });

  describe('handleWebhook', () => {
    it('should parse delivery event', async () => {
      await provider.initialize({ apiKey: 'test-api-key-12345' });
      const result = await provider.handleWebhook({
        event: 'delivered',
        email: 'test@example.com',
        list_id: '100'
      });
      expect(result.processed).toBe(true);
      expect(result.event).toBe('delivered');
    });
  });

  describe('disconnect', () => {
    it('should clear state', async () => {
      await provider.initialize({ apiKey: 'test-api-key-12345' });
      const result = await provider.disconnect();
      expect(result).toBe(true);
      expect(provider.initialized).toBe(false);
    });
  });
});
