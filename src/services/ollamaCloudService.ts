// Ollama Cloud Service - Alternative providers that host Ollama models
// These services provide Ollama-like models via API

export class OllamaCloudService {
  private apiKey: string | null
  private baseUrl: string
  private provider: string

  constructor(provider: 'together' | 'replicate' | 'groq' = 'groq') {
    this.provider = provider
    
    switch (provider) {
      case 'groq':
        // Groq provides fast Llama inference
        this.baseUrl = 'https://api.groq.com/openai/v1'
        this.apiKey = import.meta.env.VITE_GROQ_API_KEY || null
        break
      case 'together':
        // Together AI hosts many open source models including Llama
        this.baseUrl = 'https://api.together.xyz/v1'
        this.apiKey = import.meta.env.VITE_TOGETHER_API_KEY || null
        break
      case 'replicate':
        // Replicate hosts Llama and other open source models
        this.baseUrl = 'https://api.replicate.com/v1'
        this.apiKey = import.meta.env.VITE_REPLICATE_API_KEY || null
        break
      default:
        throw new Error('Unsupported provider')
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.apiKey !== null
  }

  async generateResponse(prompt: string, model?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error(`${this.provider} API key is not configured`)
    }

    try {
      switch (this.provider) {
        case 'groq':
          return await this.generateGroqResponse(prompt, model)
        case 'together':
          return await this.generateTogetherResponse(prompt, model)
        case 'replicate':
          return await this.generateReplicateResponse(prompt, model)
        default:
          throw new Error('Unsupported provider')
      }
    } catch (error) {
      console.error(`${this.provider} generation failed:`, error)
      throw error
    }
  }

  private async generateGroqResponse(prompt: string, model: string = 'llama3-8b-8192'): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: model, // groq supports: llama3-8b-8192, llama3-70b-8192, mixtral-8x7b-32768
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  private async generateTogetherResponse(prompt: string, model: string = 'meta-llama/Llama-2-7b-chat-hf'): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: model, // together supports many models including Llama-2, CodeLlama, Mistral
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Together AI error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  private async generateReplicateResponse(prompt: string, model: string = 'meta/llama-2-7b-chat'): Promise<string> {
    // Replicate uses a different API format
    const response = await fetch(`${this.baseUrl}/predictions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.apiKey}`,
      },
      body: JSON.stringify({
        version: 'f1d50bb24186c52daae319ca8366e53debdaa9e0ae7ff976e918df752732ccc4', // Llama-2-7b-chat
        input: {
          prompt: prompt,
          max_length: 1000,
          temperature: 0.7,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.status}`)
    }

    const prediction = await response.json()
    
    // Replicate is async, so we need to poll for results
    return await this.pollReplicateResult(prediction.id)
  }

  private async pollReplicateResult(predictionId: string): Promise<string> {
    let attempts = 0
    const maxAttempts = 30 // 30 seconds max

    while (attempts < maxAttempts) {
      const response = await fetch(`${this.baseUrl}/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${this.apiKey}`,
        },
      })

      const prediction = await response.json()

      if (prediction.status === 'succeeded') {
        return prediction.output.join('')
      } else if (prediction.status === 'failed') {
        throw new Error('Replicate prediction failed')
      }

      // Wait 1 second before polling again
      await new Promise(resolve => setTimeout(resolve, 1000))
      attempts++
    }

    throw new Error('Replicate prediction timeout')
  }

  getProviderInfo(): { name: string, models: string[] } {
    switch (this.provider) {
      case 'groq':
        return {
          name: 'Groq (Ultra-fast Llama inference)',
          models: ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768']
        }
      case 'together':
        return {
          name: 'Together AI (Open source models)',
          models: ['meta-llama/Llama-2-7b-chat-hf', 'meta-llama/Llama-2-13b-chat-hf', 'mistralai/Mistral-7B-Instruct-v0.1']
        }
      case 'replicate':
        return {
          name: 'Replicate (Hosted open source models)',
          models: ['meta/llama-2-7b-chat', 'meta/llama-2-13b-chat', 'meta/codellama-7b-instruct']
        }
      default:
        return { name: 'Unknown', models: [] }
    }
  }
}
