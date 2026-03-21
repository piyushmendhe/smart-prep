// Claude API utility

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

function getApiKey(): string {
  return process.env.NEXT_PUBLIC_CLAUDE_API_KEY || '';
}

function hashPrompt(prompt: string): string {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `claude-cache-${Math.abs(hash).toString(36)}`;
}

function getCached(prompt: string): string | null {
  try {
    const key = hashPrompt(prompt);
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Cache valid for 7 days
      if (Date.now() - parsed.ts < 7 * 24 * 60 * 60 * 1000) {
        return parsed.response;
      }
    }
  } catch {}
  return null;
}

function setCache(prompt: string, response: string): void {
  try {
    const key = hashPrompt(prompt);
    localStorage.setItem(key, JSON.stringify({ response, ts: Date.now() }));
  } catch {}
}

function trackTokenUsage(inputTokens: number, outputTokens: number): void {
  try {
    const existing = JSON.parse(localStorage.getItem('claude-token-usage') || '{"total_input":0,"total_output":0,"calls":0}');
    existing.total_input += inputTokens;
    existing.total_output += outputTokens;
    existing.calls += 1;
    localStorage.setItem('claude-token-usage', JSON.stringify(existing));
  } catch {}
}

export async function callClaude(prompt: string, useCache = true): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No Claude API key found. Add NEXT_PUBLIC_CLAUDE_API_KEY to .env.local');
  }

  if (useCache) {
    const cached = getCached(prompt);
    if (cached) return cached;
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  if (data.usage) {
    trackTokenUsage(data.usage.input_tokens || 0, data.usage.output_tokens || 0);
  }

  if (useCache) setCache(prompt, text);
  return text;
}

export function getTokenUsage(): { total_input: number; total_output: number; calls: number; estimated_cost: number } {
  try {
    const raw = JSON.parse(localStorage.getItem('claude-token-usage') || '{"total_input":0,"total_output":0,"calls":0}');
    // Claude Sonnet 3.5 pricing: $3/M input, $15/M output
    const estimated_cost = (raw.total_input / 1_000_000) * 3 + (raw.total_output / 1_000_000) * 15;
    return { ...raw, estimated_cost };
  } catch {
    return { total_input: 0, total_output: 0, calls: 0, estimated_cost: 0 };
  }
}
