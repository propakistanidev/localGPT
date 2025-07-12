// Cloud AI Service - Fallback when Ollama is not available
// This service provides AI functionality when deployed on Vercel

export interface CloudAiResponse {
  response: string
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class CloudAiService {
  private apiKey: string | null
  private baseUrl: string
  private provider: string

  constructor() {
    // Try different providers in order of preference (Groq for Ollama-like experience)
    if (import.meta.env.VITE_GROQ_API_KEY) {
      this.apiKey = import.meta.env.VITE_GROQ_API_KEY
      this.baseUrl = 'https://api.groq.com/openai/v1'
      this.provider = 'groq'
    } else if (import.meta.env.VITE_TOGETHER_API_KEY) {
      this.apiKey = import.meta.env.VITE_TOGETHER_API_KEY
      this.baseUrl = 'https://api.together.xyz/v1'
      this.provider = 'together'
    } else if (import.meta.env.VITE_OPENAI_API_KEY) {
      this.apiKey = import.meta.env.VITE_OPENAI_API_KEY
      this.baseUrl = 'https://api.openai.com/v1'
      this.provider = 'openai'
    } else {
      this.apiKey = null
      this.baseUrl = ''
      this.provider = 'none'
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.apiKey !== null
  }

  async generateResponse(prompt: string, model?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error(`Cloud AI service is not configured. Please add a valid API key to your environment variables.`)
    }

    try {
      // Choose default model based on provider
      const defaultModel = this.getDefaultModel()
      const selectedModel = model || defaultModel

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`${this.provider} API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error(`Invalid response format from ${this.provider} service`)
      }

      return data.choices[0].message.content
    } catch (error) {
      console.error(`${this.provider} service error:`, error)
      throw error
    }
  }

  private getDefaultModel(): string {
    switch (this.provider) {
      case 'groq':
        return 'llama3-8b-8192' // Fast Llama 3 model
      case 'together':
        return 'meta-llama/Llama-2-7b-chat-hf' // Llama 2 model
      case 'openai':
        return 'gpt-3.5-turbo'
      default:
        return 'gpt-3.5-turbo'
    }
  }

  getProviderInfo(): { name: string, model: string } {
    return {
      name: this.provider.charAt(0).toUpperCase() + this.provider.slice(1),
      model: this.getDefaultModel()
    }
  }

  // Simulate a simple response for demo purposes when no API key is available
  async generateDemoResponse(prompt: string): Promise<string> {
    // Simple demo responses for common queries
    const demoResponses: Record<string, string> = {
      'hello': 'Hello! I\'m a demo AI assistant. To get full functionality, please configure your OpenAI API key or use Ollama locally.',
      'hi': 'Hi there! This is a demo response. For full AI capabilities, please set up OpenAI API key or run Ollama locally.',
      'how are you': 'I\'m doing well, thank you! This is a demo response. For real AI conversations, please configure your API key.',
      'what is your name': 'I\'m Local GPT, a ChatGPT-like interface. Currently running in demo mode without full AI capabilities.',
    }

    // Convert prompt to lowercase for matching
    const lowerPrompt = prompt.toLowerCase().trim()
    
    // Check for exact matches first
    for (const [key, response] of Object.entries(demoResponses)) {
      if (lowerPrompt.includes(key)) {
        return response
      }
    }

    // Default demo response
    return `Thank you for your message: "${prompt}". This is a demo response since no AI service is configured. To get real AI responses, please either:

1. **For local use**: Install and run Ollama with a model (e.g., 'ollama pull llama2')
2. **For cloud use**: Add your OpenAI API key to the environment variables

Your message was received and would normally be processed by an AI model. Please configure an AI service to get intelligent responses.`
  }
}
