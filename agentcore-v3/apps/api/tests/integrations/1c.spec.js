const { OneCProvider } = require('../../services/providers/1c');

describe('OneCProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new OneCProvider();
  });

  describe('initialize', () => {
    it('should initialize with valid credentials', async () => {
      const result = await provider.initialize({
        baseUrl: 'http://1c.example.com/odata',
        username: 'admin',
        password: 'secret'
      });
      expect(result).toBe(true);
      expect(provider.initialized).toBe(true);
    });

    it('should reject missing baseUrl', async () => {
      await expect(provider.initialize({ username: 'admin', password: 'secret' })).rejects.toThrow('baseUrl');
    });

    it('should reject missing username', async () => {
      await expect(provider.initialize({ baseUrl: 'http://1c.example.com', password: 'secret' })).rejects.toThrow('username');
    });
  });

  describe('handleWebhook', () => {
    it('should parse sync webhook', async () => {
      await provider.initialize({ baseUrl: 'http://1c.example.com', username: 'admin', password: 'secret' });
      const result = await provider.handleWebhook({
        entity: 'Catalog_Контрагенты',
        action: 'sync',
        data: { Ref: 'abc123' }
      });
      expect(result.processed).toBe(true);
      expect(result.entity).toBe('Catalog_Контрагенты');
    });
  });

  describe('disconnect', () => {
    it('should clear state', async () => {
      await provider.initialize({ baseUrl: 'http://1c.example.com', username: 'admin', password: 'secret' });
      const result = await provider.disconnect();
      expect(result).toBe(true);
      expect(provider.initialized).toBe(false);
    });
  });
});
