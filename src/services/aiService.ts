import { coreApi } from '@/lib/coreApi';

/**
 * AI generation is intentionally delegated to Core API.
 * Provider credentials must never be exposed in a Vite client bundle.
 */
export async function generateAIContent(prompt: string, context = ''): Promise<string> {
  if (!prompt.trim()) throw new Error('Prompt AI wajib diisi.');
  const result = await coreApi.generateAIContent({ prompt: prompt.trim(), context: context.trim() });
  return result.content;
}
