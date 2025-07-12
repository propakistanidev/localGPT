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

  constructor() {
    // Try to get API key from environment variables
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || null
    this.baseUrl = 'https://api.openai.com/v1'
  }

  async isAvailable(): Promise<boolean> {
    return this.apiKey !== null
  }

  async generateResponse(prompt: string, model: string = 'gpt-3.5-turbo'): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Cloud AI service is not configured. Please add VITE_OPENAI_API_KEY to your environment variables.')
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: model,
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
        throw new Error(`Cloud AI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from Cloud AI service')
      }

      return data.choices[0].message.content
    } catch (error) {
      console.error('Cloud AI service error:', error)
      throw error
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
