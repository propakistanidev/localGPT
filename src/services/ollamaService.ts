import axios from 'axios'

export interface OllamaResponse {
  model: string
  response: string
  done: boolean
  context?: number[]
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

export interface OllamaModel {
  name: string
  modified_at: string
  size: number
  digest: string
  details: {
    format: string
    family: string
    families: string[]
    parameter_size: string
    quantization_level: string
  }
}

export class OllamaService {
  private baseUrl: string
  private defaultModel: string

  constructor(baseUrl: string = 'http://localhost:11434', defaultModel: string = 'llama3.2') {
    this.baseUrl = baseUrl
    this.defaultModel = defaultModel
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/version`, { timeout: 5000 })
      return response.status === 200
    } catch (error) {
      console.error('Ollama connection check failed:', error)
      return false
    }
  }

  async getModels(): Promise<OllamaModel[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`)
      return response.data.models || []
    } catch (error) {
      console.error('Failed to get models:', error)
      throw new Error('Failed to fetch available models')
    }
  }

  async generateResponse(prompt: string, model?: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/generate`,
        {
          model: model || this.defaultModel,
          prompt: prompt,
          stream: false
        },
        {
          timeout: 30000, // 30 seconds timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data && response.data.response) {
        return response.data.response
      } else {
        throw new Error('Invalid response format from Ollama')
      }
    } catch (error) {
      console.error('Ollama generation failed:', error)
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Ollama service is not running. Please start Ollama first.')
        } else if (error.response?.status === 404) {
          throw new Error(`Model "${model || this.defaultModel}" not found. Please pull the model first.`)
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. The model might be too slow or overloaded.')
        }
      }
      throw new Error('Failed to generate response from Ollama')
    }
  }

  setDefaultModel(model: string): void {
    this.defaultModel = model
  }

  getDefaultModel(): string {
    return this.defaultModel
  }
}
