const { MailRuProvider } = require('../../services/providers/mailru');

describe('MailRuProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new MailRuProvider();
  });

  describe('initialize', () => {
    it('should initialize with email and password', async () => {
      const result = await provider.initialize({
        email: 'test@mail.ru',
        password: 'app-password'
      });
      expect(result).toBe(true);
      expect(provider.initialized).toBe(true);
    });

    it('should initialize with accessToken', async () => {
      const result = await provider.initialize({
        email: 'test@mail.ru',
        accessToken: 'oauth-token'
      });
      expect(result).toBe(true);
    });

    it('should reject missing email', async () => {
      await expect(provider.initialize({ password: 'test' })).rejects.toThrow('email');
    });
  });

  describe('handleWebhook', () => {
    it('should parse new_message event', async () => {
      await provider.initialize({ email: 'test@mail.ru', password: 'test' });
      const result = await provider.handleWebhook({
        event: 'new_message',
        from: 'sender@mail.ru',
        subject: 'Test',
        text: 'Hello'
      });
      expect(result.processed).toBe(true);
      expect(result.text).toBe('Hello');
    });
  });

  describe('disconnect', () => {
    it('should clear state', async () => {
      await provider.initialize({ email: 'test@mail.ru', password: 'test' });
      const result = await provider.disconnect();
      expect(result).toBe(true);
      expect(provider.initialized).toBe(false);
    });
  });
});
