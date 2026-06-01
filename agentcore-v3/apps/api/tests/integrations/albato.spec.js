const { AlbatoProvider } = require('../../services/providers/albato');

describe('AlbatoProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new AlbatoProvider();
  });

  describe('initialize', () => {
    it('should initialize with valid apiToken', async () => {
      const result = await provider.initialize({ apiToken: 'test-token-long' });
      expect(result).toBe(true);
      expect(provider.initialized).toBe(true);
    });

    it('should reject missing apiToken', async () => {
      await expect(provider.initialize({})).rejects.toThrow('apiToken');
    });
  });

  describe('handleWebhook', () => {
    it('should parse scenario completion', async () => {
      await provider.initialize({ apiToken: 'test-token-long' });
      const result = await provider.handleWebhook({
        scenario_id: 'sc1',
        execution_id: 'ex1',
        event: 'scenario_complete',
        data: { result: 'ok' }
      });
      expect(result.processed).toBe(true);
      expect(result.scenarioId).toBe('sc1');
    });
  });

  describe('disconnect', () => {
    it('should clear state', async () => {
      await provider.initialize({ apiToken: 'test-token-long' });
      const result = await provider.disconnect();
      expect(result).toBe(true);
      expect(provider.initialized).toBe(false);
    });
  });
});
