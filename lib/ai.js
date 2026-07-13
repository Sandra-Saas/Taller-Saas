// AI Provider abstraction layer
// Supports multiple providers: openai, anthropic, google, groq, ollama, deepseek, openrouter

class AIProvider {
  constructor(config) {
    this.config = config;
  }

  async generateText(messages) {
    throw new Error('generateText not implemented');
  }

  async getEmbedding(text) {
    throw new Error('getEmbedding not implemented');
  }
}

class OpenAIProvider extends AIProvider {
  async generateText(messages) {
    // Implement OpenAI API call here
    return "OpenAI response placeholder";
  }
}

class AnthropicProvider extends AIProvider {
  async generateText(messages) {
    // Implement Anthropic API call here
    return "Anthropic response placeholder";
  }
}

class GoogleProvider extends AIProvider {
  async generateText(messages) {
    // Implement Google Gemini API call here
    return "Google response placeholder";
  }
}

class GroqProvider extends AIProvider {
  async generateText(messages) {
    // Implement Groq API call here
    return "Groq response placeholder";
  }
}

class OllamaProvider extends AIProvider {
  async generateText(messages) {
    // Implement Ollama local API call here
    return "Ollama response placeholder";
  }
}

class DeepSeekProvider extends AIProvider {
  async generateText(messages) {
    // Implement DeepSeek API call here
    return "DeepSeek response placeholder";
  }
}

class OpenRouterProvider extends AIProvider {
  async generateText(messages) {
    // Implement OpenRouter API call here
    return "OpenRouter response placeholder";
  }
}

const PROVIDERS = {
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
  google: GoogleProvider,
  groq: GroqProvider,
  ollama: OllamaProvider,
  deepseek: DeepSeekProvider,
  openrouter: OpenRouterProvider,
};

export async function getAIProvider(tenantId) {
  // Fetch AI settings for this tenant
  const prisma = (await import('./prisma')).default;
  const aiSettings = await prisma.aISetting.findUnique({
    where: { tenantId },
  });

  if (!aiSettings || !aiSettings.isActive) {
    throw new Error('AI not configured or inactive');
  }

  const ProviderClass = PROVIDERS[aiSettings.provider];
  if (!ProviderClass) {
    throw new Error(`Provider ${aiSettings.provider} not supported`);
  }

  return new ProviderClass({
    model: aiSettings.model,
    temperature: aiSettings.temperature,
    maxTokens: aiSettings.maxTokens,
    apiKey: aiSettings.apiKey,
    language: aiSettings.language,
  });
}

export async function generateAIResponse(tenantId, messages, type = 'assistant') {
  const provider = await getAIProvider(tenantId);
  const response = await provider.generateText(messages);

  // Save query to audit/AIQuery
  const prisma = (await import('./prisma')).default;
  await prisma.aIQuery.create({
    data: {
      tenantId,
      query: JSON.stringify(messages),
      response,
      type,
    },
  });

  return response;
}

export const buildSystemPrompt = (tenantData, language = 'es') => {
  return `
Eres un asistente inteligente para un taller mecánico. Responde únicamente con información del taller.
Idioma: ${language}.
Información del taller: ${JSON.stringify(tenantData)}.
`.trim();
};
