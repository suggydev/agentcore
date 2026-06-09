const { Bitrix24Provider } = require('../../services/providers/bitrix24');

describe('Bitrix24Provider', () => {
  let provider;

  beforeEach(() => {
    provider = new Bitrix24Provider();
  });

  describe('initialize', () => {
    it('should initialize with webhook credentials', async () => {
      const result = await provider.initialize({
        domain: 'test.bitrix24.ru',
        webhookUserId: '1',
        webhookToken: 'test-token'
      });
      expect(result).toBeUndefined();
      expect(provider.initialized).toBe(true);
    });

    it('should reject missing domain', async () => {
      await expect(provider.initialize({})).rejects.toThrow('domain');
    });
  });

  describe('handleWebhook', () => {
    it('should parse event webhook', async () => {
      await provider.initialize({ domain: 'test.bitrix24.ru', webhookUserId: '1', webhookToken: 'test' });
      const result = await provider.handleWebhook({
        event: 'onCrmLeadUpdate',
        data: { FIELDS: { ID: '123' } }
      });
      expect(result.processed).toBe(true);
      expect(result.events.length).toBe(1);
    });
  });

  describe('disconnect', () => {
    it('should clear state', async () => {
      await provider.initialize({ domain: 'test.bitrix24.ru', webhookUserId: '1', webhookToken: 'test' });
      const result = await provider.disconnect();
      expect(result).toBe(true);
      expect(provider.initialized).toBe(false);
    });
  });
});
