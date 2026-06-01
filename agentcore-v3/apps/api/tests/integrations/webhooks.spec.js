const { WebhooksProvider } = require('../../services/providers/webhooks');

describe('WebhooksProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new WebhooksProvider();
  });

  describe('initialize', () => {
    it('should initialize with secret', async () => {
      const result = await provider.initialize({ secret: 'my-webhook-secret' });
      expect(result).toBe(true);
      expect(provider.initialized).toBe(true);
    });

    it('should reject missing secret', async () => {
      await expect(provider.initialize({})).rejects.toThrow('secret');
    });
  });

  describe('signature verification', () => {
    it('should compute and verify valid signature', async () => {
      await provider.initialize({ secret: 'my-secret' });
      const payload = { test: true, event: 'custom' };
      const signature = provider.computeSignature(payload);
      const isValid = provider.verifySignature(payload, signature);
      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', async () => {
      await provider.initialize({ secret: 'my-secret' });
      const payload = { test: true };
      expect(provider.verifySignature(payload, 'invalid')).toBe(false);
    });
  });

  describe('handleWebhook', () => {
    it('should parse valid webhook with signature', async () => {
      await provider.initialize({ secret: 'my-secret' });
      const payload = { event: 'custom', data: { key: 'value' } };
      const signature = provider.computeSignature(payload);
      const result = await provider.handleWebhook(payload, signature);
      expect(result.processed).toBe(true);
    });

    it('should reject invalid signature', async () => {
      await provider.initialize({ secret: 'my-secret' });
      await expect(provider.handleWebhook({ event: 'test' }, 'bad-signature')).rejects.toThrow('Invalid signature');
    });
  });

  describe('generateWebhookUrl', () => {
    it('should generate correct URL', async () => {
      await provider.initialize({ secret: 'my-secret' });
      const url = provider.generateWebhookUrl('https://api.example.com', 'agent-123');
      expect(url).toBe('https://api.example.com/api/webhooks/webhooks/agent-123');
    });
  });

  describe('disconnect', () => {
    it('should clear state', async () => {
      await provider.initialize({ secret: 'my-secret' });
      const result = await provider.disconnect();
      expect(result).toBe(true);
      expect(provider.initialized).toBe(false);
    });
  });
});
