const { AmoCRMProvider } = require('../../services/providers/amocrm');

describe('AmoCRMProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new AmoCRMProvider();
  });

  describe('initialize', () => {
    it('should restore session from saved tokens', async () => {
      provider._validateToken = jest.fn().mockResolvedValue(true);
      const result = await provider.initialize({
        domain: 'test',
        clientId: 'id',
        clientSecret: 'secret',
        redirectUri: 'https://example.com/callback',
        accessToken: 'existing-token',
        refreshToken: 'existing-refresh'
      });
      expect(result.authorized).toBe(true);
      expect(provider.initialized).toBe(true);
    });

    it('should return authUrl when no code provided', async () => {
      const result = await provider.initialize({
        domain: 'test',
        clientId: 'id',
        clientSecret: 'secret',
        redirectUri: 'https://example.com/callback'
      });
      expect(result.authorized).toBe(false);
      expect(result.authUrl).toBeDefined();
    });

    it('should reject missing domain', async () => {
      await expect(provider.initialize({})).rejects.toThrow('domain');
    });
  });

  describe('handleWebhook', () => {
    it('should parse contact events', async () => {
      await provider.initialize({ domain: 'test', clientId: 'id', clientSecret: 'secret', redirectUri: 'https://example.com', accessToken: 'token', refreshToken: 'refresh' });
      provider._validateToken = jest.fn().mockResolvedValue(true);
      const result = await provider.webhookHandler({
        body: {
          contacts: { add: [{ id: 1, name: 'Test' }] },
          account: { subdomain: 'test' }
        },
        headers: {}
      }, null);
      expect(result.events.length).toBeGreaterThan(0);
    });
  });

  describe('disconnect', () => {
    it('should clear state', async () => {
      provider._validateToken = jest.fn().mockResolvedValue(true);
      await provider.initialize({ domain: 'test', clientId: 'id', clientSecret: 'secret', redirectUri: 'https://example.com', accessToken: 'token', refreshToken: 'refresh' });
      const result = await provider.disconnect();
      expect(result).toBe(true);
      expect(provider.initialized).toBe(false);
    });
  });
});
