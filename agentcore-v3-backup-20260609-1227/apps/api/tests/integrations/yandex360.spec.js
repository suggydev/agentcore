const { Yandex360Provider } = require('../../services/providers/yandex360');

describe('Yandex360Provider', () => {
  let provider;

  beforeEach(() => {
    provider = new Yandex360Provider();
  });

  describe('initialize', () => {
    it('should initialize with accessToken and orgId', async () => {
      const result = await provider.initialize({
        orgId: '12345',
        clientId: 'id',
        clientSecret: 'secret',
        accessToken: 'test-token'
      });
      expect(result).toBe(true);
      expect(provider.initialized).toBe(true);
    });

    it('should reject missing orgId', async () => {
      await expect(provider.initialize({ accessToken: 'test' })).rejects.toThrow('orgId');
    });
  });

  describe('handleWebhook', () => {
    it('should parse event', async () => {
      await provider.initialize({ orgId: '123', clientId: 'id', clientSecret: 'secret', accessToken: 'token' });
      const result = await provider.handleWebhook({ event: 'user_created', data: { uid: '123' } });
      expect(result.processed).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should clear state', async () => {
      await provider.initialize({ orgId: '123', clientId: 'id', clientSecret: 'secret', accessToken: 'token' });
      const result = await provider.disconnect();
      expect(result).toBe(true);
      expect(provider.initialized).toBe(false);
    });
  });
});
