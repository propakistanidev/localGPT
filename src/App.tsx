import { useState, useRef, useEffect } from 'react'
import { OllamaService } from './services/ollamaService'
import { MessageCircle } from 'lucide-react'
import { CloudAiService } from './services/cloudAiService'
import './App.css'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

const ollamaService = new OllamaService()
const cloudAiService = new CloudAiService()

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your local AI assistant. How can I help you today?',
      role: 'assistant',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [cloudAiAvailable, setCloudAiAvailable] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check Ollama connection and cloud AI availability on component mount
  useEffect(() => {
    checkConnection()
    checkCloudAi()
  }, [])

  const checkCloudAi = async () => {
    try {
      const available = await cloudAiService.isAvailable()
      setCloudAiAvailable(available)
    } catch (error) {
      setCloudAiAvailable(false)
    }
  }

  const checkConnection = async () => {
    try {
      const connected = await ollamaService.checkConnection()
      setIsConnected(connected)
    } catch (error) {
      setIsConnected(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const userInput = input
    setInput('')
    setIsLoading(true)

    try {
      if (isConnected) {
        // Use actual Ollama service
        const response = await ollamaService.generateResponse(userInput)
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response,
          role: 'assistant',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        // Use Cloud AI if configured
        try {
          const cloudAvailable = await cloudAiService.isAvailable()
          if (cloudAvailable) {
            const cloudResponse = await cloudAiService.generateResponse(userInput)
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: cloudResponse,
              role: 'assistant',
              timestamp: new Date()
            }
            setMessages(prev => [...prev, assistantMessage])
          } else {
            // Handle when no AI service is configured
            const demoResponse = await cloudAiService.generateDemoResponse(userInput)
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: demoResponse,
              role: 'assistant',
              timestamp: new Date()
            }
            setMessages(prev => [...prev, assistantMessage])
          }
        } catch (error) {
          console.error('Cloud AI error:', error)
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `Error: ${error instanceof Error ? error.message : 'Failed to generate response'}`,
            role: 'assistant',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, errorMessage])
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Error: ${error instanceof Error ? error.message : 'Failed to generate response'}`,
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold flex items-center space-x-2">
            <MessageCircle className="w-6 h-6" />
            <span>Local GPT</span>
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : (cloudAiAvailable ? 'bg-yellow-500' : 'bg-red-500')}`}></div>
              <span className="text-sm text-gray-300">
                {isConnected ? 'Ollama Connected' : (cloudAiAvailable ? 'Cloud AI Ready' : 'Demo Mode')}
              </span>
            </div>
            {!isConnected && (
              <button
                onClick={checkConnection}
                className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-700 text-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-400">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
