import { useState, useRef, useEffect } from 'react'
import { OllamaService } from './services/ollamaService'
import { MessageCircle, Plus, Archive, Trash2, Share2, Menu, X } from 'lucide-react'
import { CloudAiService } from './services/cloudAiService'
import './App.css'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface ChatHistory {
  id: string
  title: string
  messages: Message[]
  lastMessage: Date
  isArchived: boolean
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
  const [currentChatId, setCurrentChatId] = useState<string>('default')
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([
    {
      id: 'default',
      title: 'New Chat',
      messages: [
        {
          id: '1',
          content: 'Hello! I\'m your local AI assistant. How can I help you today?',
          role: 'assistant',
          timestamp: new Date()
        }
      ],
      lastMessage: new Date(),
      isArchived: false
    }
  ])
  const [selectedChats, setSelectedChats] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [selectedModel, setSelectedModel] = useState<string>('deepseek-r1')
  const [modelSelectedMessage, setModelSelectedMessage] = useState<string>('')
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

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)

    // Update chat history
    setChatHistory(prev => prev.map(chat =>
      chat.id === currentChatId
        ? { ...chat, messages: newMessages, lastMessage: new Date() }
        : chat
    ))

    const userInput = input
    setInput('')
    setIsLoading(true)

    try {
      if (isConnected) {
        // Use actual Ollama service with selected model
        const response = await ollamaService.generateResponse(userInput, selectedModel)
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response,
          role: 'assistant',
          timestamp: new Date()
        }
        const updatedMessages = [...newMessages, assistantMessage]
        setMessages(updatedMessages)

        // Update chat history
        setChatHistory(prev => prev.map(chat =>
          chat.id === currentChatId
            ? { ...chat, messages: updatedMessages, lastMessage: new Date() }
            : chat
        ))
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
            const updatedMessages = [...newMessages, assistantMessage]
            setMessages(updatedMessages)

            // Update chat history
            setChatHistory(prev => prev.map(chat =>
              chat.id === currentChatId
                ? { ...chat, messages: updatedMessages, lastMessage: new Date() }
                : chat
            ))
          } else {
            // Handle when no AI service is configured
            const demoResponse = await cloudAiService.generateDemoResponse(userInput)
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: demoResponse,
              role: 'assistant',
              timestamp: new Date()
            }
            const updatedMessages = [...newMessages, assistantMessage]
            setMessages(updatedMessages)

            // Update chat history
            setChatHistory(prev => prev.map(chat =>
              chat.id === currentChatId
                ? { ...chat, messages: updatedMessages, lastMessage: new Date() }
                : chat
            ))
          }
        } catch (error) {
          console.error('Cloud AI error:', error)
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `Error: ${error instanceof Error ? error.message : 'Failed to generate response'}`,
            role: 'assistant',
            timestamp: new Date()
          }
          const updatedMessages = [...newMessages, errorMessage]
          setMessages(updatedMessages)

          // Update chat history
          setChatHistory(prev => prev.map(chat =>
            chat.id === currentChatId
              ? { ...chat, messages: updatedMessages, lastMessage: new Date() }
              : chat
          ))
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
      const updatedMessages = [...newMessages, errorMessage]
      setMessages(updatedMessages)

      // Update chat history
      setChatHistory(prev => prev.map(chat =>
        chat.id === currentChatId
          ? { ...chat, messages: updatedMessages, lastMessage: new Date() }
          : chat
      ))
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

  const createNewChat = () => {
    const newChatId = Date.now().toString()
    const newChat: ChatHistory = {
      id: newChatId,
      title: 'New Chat',
      messages: [
        {
          id: '1',
          content: 'Hello! I\'m your local AI assistant. How can I help you today?',
          role: 'assistant',
          timestamp: new Date()
        }
      ],
      lastMessage: new Date(),
      isArchived: false
    }
    setChatHistory(prev => [newChat, ...prev])
    setCurrentChatId(newChatId)
    setMessages(newChat.messages)
  }

  const selectChat = (chatId: string) => {
    const chat = chatHistory.find(c => c.id === chatId)
    if (chat) {
      setCurrentChatId(chatId)
      setMessages(chat.messages)
    }
  }

  const toggleChatSelection = (chatId: string) => {
    setSelectedChats(prev =>
      prev.includes(chatId)
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    )
  }

  const deleteSelectedChats = () => {
    setChatHistory(prev => prev.filter(chat => !selectedChats.includes(chat.id)))
    if (selectedChats.includes(currentChatId)) {
      const remainingChats = chatHistory.filter(chat => !selectedChats.includes(chat.id))
      if (remainingChats.length > 0) {
        selectChat(remainingChats[0].id)
      } else {
        createNewChat()
      }
    }
    setSelectedChats([])
    setIsSelectionMode(false)
  }

  const archiveSelectedChats = () => {
    setChatHistory(prev => prev.map(chat =>
      selectedChats.includes(chat.id)
        ? { ...chat, isArchived: true }
        : chat
    ))
    setSelectedChats([])
    setIsSelectionMode(false)
  }

  const shareSelectedChats = () => {
    // Implement share functionality
    console.log('Sharing chats:', selectedChats)
    setSelectedChats([])
    setIsSelectionMode(false)
  }

  const generateChatTitle = (messages: Message[]) => {
    const userMessages = messages.filter(m => m.role === 'user')
    if (userMessages.length > 0) {
      return userMessages[0].content.substring(0, 30) + (userMessages[0].content.length > 30 ? '...' : '')
    }
    return 'New Chat'
  }

  // Handle model selection
  const handleModelChange = (model: string) => {
    setSelectedModel(model)
    
    // List of fully integrated models
    const integratedModels = ['deepseek-r1', 'deepseek-coder']
    
    // Check if the selected model is integrated
    if (integratedModels.includes(model)) {
      setModelSelectedMessage(`✅ ${model} has been selected and is ready to use`)
    } else {
      setModelSelectedMessage(`⚠️ ${model} selected - Full integration will be added soon`)
    }
    
    // Clear the message after 4 seconds
    setTimeout(() => {
      setModelSelectedMessage('')
    }, 4000)
  }

  // Update chat titles based on first user message
  useEffect(() => {
    setChatHistory(prev => prev.map(chat => ({
      ...chat,
      title: generateChatTitle(chat.messages)
    })))
  }, [messages])

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Chat History</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-gray-400 hover:text-white transition-colors lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={createNewChat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Selection Mode Controls */}
        {isSelectionMode && (
          <div className="p-4 border-b border-gray-700 bg-gray-750">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-300">{selectedChats.length} selected</span>
              <button
                onClick={() => {
                  setIsSelectionMode(false)
                  setSelectedChats([])
                }}
                className="text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={deleteSelectedChats}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center justify-center space-x-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
              <button
                onClick={archiveSelectedChats}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm flex items-center justify-center space-x-1"
              >
                <Archive className="w-3 h-3" />
                <span>Archive</span>
              </button>
              <button
                onClick={shareSelectedChats}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center justify-center space-x-1"
              >
                <Share2 className="w-3 h-3" />
                <span>Share</span>
              </button>
            </div>
          </div>
        )}

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {chatHistory.filter(chat => !chat.isArchived).map((chat) => (
              <div
                key={chat.id}
                className={`relative p-3 rounded-lg cursor-pointer transition-colors ${chat.id === currentChatId ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                onClick={() => {
                  if (isSelectionMode) {
                    toggleChatSelection(chat.id)
                  } else {
                    selectChat(chat.id)
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setIsSelectionMode(true)
                  toggleChatSelection(chat.id)
                }}
              >
                {isSelectionMode && (
                  <div className="absolute top-2 right-2">
                    <div className={`w-4 h-4 rounded border-2 ${selectedChats.includes(chat.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-400'
                      }`}>
                      {selectedChats.includes(chat.id) && (
                        <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}
                <h3 className="text-sm font-medium truncate pr-5">{chat.title}</h3>
                <p className="text-xs font-medium  text-white mt-0.5">
                  {chat.lastMessage.toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>

          {/* Archived Section */}
          {chatHistory.some(chat => chat.isArchived) && (
            <div className="mt-5">
              <h3 className="text-sm font-medium text-gray-400 mb-1">Archived</h3>
              <div className="space-y-1">
                {chatHistory.filter(chat => chat.isArchived).map((chat) => (
                  <div
                    key={chat.id}
                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 cursor-pointer transition-colors opacity-60"
                    onClick={() => selectChat(chat.id)}
                  >
                    <h3 className="text-sm font-medium truncate">{chat.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {chat.lastMessage.toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`text-gray-400 hover:text-white transition-colors ${isSidebarOpen ? 'lg:hidden' : ''}`}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold flex items-center space-x-3">
                <MessageCircle className="w-6 h-6" />
                <span className="text-white">Local GPT</span>
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="deepseek-r1">Deepseek R1</option>
                <option value="deepseek-coder">Deepseek Coder</option>
                <option value="llama3.2">Llama 3.2</option>
                <option value="llama3.1">Llama 3.1</option>
                <option value="codellama">Code Llama</option>
                <option value="mistral">Mistral</option>
                <option value="phi3">Phi-3</option>
              </select>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : (cloudAiAvailable ? 'bg-yellow-500' : 'bg-red-500')}`}></div>
                <span className="text-sm text-gray-300">
                  {isConnected ? 'Ollama Connected' : (cloudAiAvailable ? `${cloudAiService.getProviderInfo().name} Ready` : 'Demo Mode')}
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

        {/* Model Selection Message */}
        {modelSelectedMessage && (
          <div className={`px-4 py-3 rounded mx-4 mb-2 ${
            modelSelectedMessage.includes('✅') 
              ? 'bg-green-100 border border-green-400 text-green-700' 
              : 'bg-yellow-100 border border-yellow-400 text-yellow-700'
          }`}>
            {modelSelectedMessage}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="w-full space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${message.role === 'user'
                    ? 'bg-blue-600 text-white ml-auto'
                    : 'bg-gray-700 text-gray-100 mr-auto'
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
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center space-x-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
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
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
