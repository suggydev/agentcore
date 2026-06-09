const { GoogleDriveProvider } = require('../../services/providers/gdrive');

describe('GoogleDriveProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new GoogleDriveProvider();
  });

  describe('initialize', () => {
    it('should initialize with accessToken', async () => {
      const result = await provider.initialize({ accessToken: 'test-token', refreshToken: 'test-refresh' });
      expect(result).toBe(true);
      expect(provider.initialized).toBe(true);
    });

    it('should accept clientId+clientSecret', async () => {
      const result = await provider.initialize({ clientId: 'id', clientSecret: 'secret' });
      expect(result).toBe(true);
    });

    it('should reject missing credentials', async () => {
      await expect(provider.initialize({})).rejects.toThrow();
    });
  });

  describe('handleWebhook', () => {
    it('should parse change notification', async () => {
      await provider.initialize({ accessToken: 'test-token' });
      const result = await provider.handleWebhook({
        changes: [{ fileId: 'file1', kind: 'drive#change', removed: false }]
      });
      expect(result.processed).toBe(true);
      expect(result.changes.length).toBe(1);
    });
  });

  describe('disconnect', () => {
    it('should clear state', async () => {
      await provider.initialize({ accessToken: 'test-token' });
      const result = await provider.disconnect();
      expect(result).toBe(true);
      expect(provider.initialized).toBe(false);
    });
  });
});
