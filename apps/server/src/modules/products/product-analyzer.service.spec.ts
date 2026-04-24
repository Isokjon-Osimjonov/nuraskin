import { vi, describe, it, expect, beforeEach } from 'vitest';
import OpenAI from 'openai';

vi.mock('openai', () => {
  const mockCreate = vi.fn();
  return {
    mockCreate, // Exporting it for use in tests
    default: class {
      chat = {
        completions: {
          create: mockCreate,
        },
      };
    },
    OpenAI: class {
      chat = {
        completions: {
          create: mockCreate,
        },
      };
    },
  };
});

vi.mock('../../common/config/env', () => ({
  env: { OPENAI_API_KEY: 'test-key' },
}));

// Import after mocking
import { analyzeImage } from './product-analyzer.service';

describe('product-analyzer.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws AI_PARSE_FAILED when JSON is unparseable', async () => {
    const { mockCreate } = await import('openai') as any;
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'not valid json' } }],
    });

    await expect(analyzeImage('https://example.com/image.jpg')).rejects.toThrow('AI_PARSE_FAILED');
  });

  it('throws AI_PARSE_FAILED when required fields are missing', async () => {
    const { mockCreate } = await import('openai') as any;
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '{"name": "Only Name"}' } }],
    });

    await expect(analyzeImage('https://example.com/image.jpg')).rejects.toThrow('AI_PARSE_FAILED');
  });
});
