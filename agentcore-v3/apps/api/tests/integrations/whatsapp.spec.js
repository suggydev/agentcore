const { WhatsAppProvider } = require('../../services/providers/whatsapp');
const { encryption } = require('./setup');

describe('WhatsAppProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new WhatsAppProvider();
  });

  describe('initialize', () => {
    it('should initialize with required credentials', async () => {
      const result = await provider.initialize({
        phoneNumberId: '123456',
        accessToken: 'test-token'
      });
      expect(result).toBe();
      expect(provider.initialized).toBe(true);
    });

    it('should reject missing phoneNumberId', async () => {
      await expect(provider.initialize({ accessToken: 'test' })).rejects.toThrow();
    });
  });

  describe('handleWebhook', () => {
    it('should parse incoming messages', async () => {
      await provider.initialize({ phoneNumberId: '123', accessToken: 'test' });
      const result = await provider.handleWebhook({
        entry: [{
          changes: [{
            field: 'messages',
            value: {
              messages: [{ id: 'wamid1', from: '79001234567', timestamp: '1700000000', type: 'text', text: { body: 'Hello' } }],
              metadata: { phone_number_id: '123' }
            }
          }]
        }]
      });
      expect(result.processed).toBe(true);
      expect(result.messages.length).toBe(1);
      expect(result.messages[0].text).toBe('Hello');
    });

    it('should return processed false for empty payload', async () => {
      await provider.initialize({ phoneNumberId: '123', accessToken: 'test' });
      const result = await provider.handleWebhook({ entry: [] });
      expect(result.processed).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should clear credentials', async () => {
      await provider.initialize({ phoneNumberId: '123', accessToken: 'test' });
      const result = await provider.disconnect();
      expect(result).toBe(true);
      expect(provider.initialized).toBe(false);
    });
  });

  describe('encryption roundtrip', () => {
    it('should encrypt and decrypt WhatsApp credentials', () => {
      const creds = JSON.stringify({ phoneNumberId: '123', accessToken: 'secret' });
      expect(encryption.decrypt(encryption.encrypt(creds))).toBe(creds);
    });
  });
});
