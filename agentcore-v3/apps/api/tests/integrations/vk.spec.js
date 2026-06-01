const { VkProvider } = require('../../services/providers/vk');

describe('VkProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new VkProvider();
  });

  describe('initialize', () => {
    it('should initialize with valid credentials', async () => {
      const result = await provider.initialize({ accessToken: 'test-token', groupId: '12345' });
      expect(result).toBe(true);
      expect(provider.initialized).toBe(true);
    });

    it('should reject missing accessToken', async () => {
      await expect(provider.initialize({ groupId: '123' })).rejects.toThrow('accessToken');
    });

    it('should reject missing groupId', async () => {
      await expect(provider.initialize({ accessToken: 'test' })).rejects.toThrow('groupId');
    });
  });

  describe('handleWebhook', () => {
    it('should handle message_new event', async () => {
      await provider.initialize({ accessToken: 'test', groupId: '123' });
      const result = await provider.handleWebhook({
        type: 'message_new',
        object: { message: { peer_id: 200, text: 'Hello', from_id: 100, id: 1 } }
      });
      expect(result.processed).toBe(true);
      expect(result.text).toBe('Hello');
      expect(result.peerId).toBe(200);
    });

    it('should handle confirmation event', async () => {
      await provider.initialize({ accessToken: 'test', groupId: '123' });
      const result = await provider.handleWebhook({ type: 'confirmation' });
      expect(result.processed).toBe(true);
      expect(result.confirmation).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should clear credentials', async () => {
      await provider.initialize({ accessToken: 'test', groupId: '123' });
      const result = await provider.disconnect();
      expect(result).toBe(true);
      expect(provider.initialized).toBe(false);
    });
  });
});
