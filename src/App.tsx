import { useState, useRef, useEffect } from 'react'
import { OllamaService, type OllamaModel } from './services/ollamaService'
import { Archive, Trash2, Share2, Menu, X, ArchiveRestore } from 'lucide-react'
import { CloudAiService } from './services/cloudAiService'
import * as XLSX from 'xlsx'
import './App.css'
import { Icon } from '@iconify/react'
import GlitchText from './components/GlitchText'
import MagicBento from './components/MagicBento'
import Modal from './components/Modal'

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
      content: 'Hello! I\'m your local GPT. How can I help you today?',
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
          content: 'Hello! I\'m your local GPT. How can I help you today?',
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
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [modelSelectedMessage, setModelSelectedMessage] = useState<string>('')
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [showArchivedChats, setShowArchivedChats] = useState(false)
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)


  // Check Ollama connection and cloud AI availability on component mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await Promise.all([
          checkConnection(),
          checkCloudAi()
        ])
      } catch (error) {
        console.error('App initialization failed:', error)
      }
    }

    initializeApp()
  }, [])

  // Save chat history to localStorage
  useEffect(() => {
    const saveChatHistory = () => {
      try {
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory))
      } catch (error) {
        console.error('Failed to save chat history:', error)
      }
    }
    saveChatHistory()
  }, [chatHistory])

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const loadChatHistory = () => {
      try {
        const savedHistory = localStorage.getItem('chatHistory')
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory)
          // Convert timestamp strings back to Date objects
          const restoredHistory = parsedHistory.map((chat: any) => ({
            ...chat,
            lastMessage: new Date(chat.lastMessage),
            messages: chat.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }))
          setChatHistory(restoredHistory)

          // Set current chat to the first non-archived chat
          const firstChat = restoredHistory.find((chat: any) => !chat.isArchived)
          if (firstChat) {
            setCurrentChatId(firstChat.id)
            setMessages(firstChat.messages)
          }
        }
      } catch (error) {
        console.error('Failed to load chat history:', error)
      }
    }
    loadChatHistory()
  }, [])

  const checkCloudAi = async () => {
    try {
      const available = await cloudAiService.isAvailable()
      setCloudAiAvailable(available)
    } catch (error) {
      console.error('Cloud AI check failed:', error)
      setCloudAiAvailable(false)
    }
  }

  const checkConnection = async () => {
    try {
      const connected = await ollamaService.checkConnection()
      setIsConnected(connected)
      if (connected) {
        fetchAvailableModels()
      } else {
        setAvailableModels([])
        setSelectedModel('')
      }
    } catch (error) {
      console.error('Connection check failed:', error)
      setIsConnected(false)
      setAvailableModels([])
      setSelectedModel('')
    }
  }

  const fetchAvailableModels = async () => {
    setIsLoadingModels(true)
    try {
      const models = await ollamaService.getModels()
      setAvailableModels(models)

      // Auto-select the first available model if none is selected
      if (!selectedModel && models.length > 0) {
        const firstModel = models[0].name.replace(':latest', '')
        setSelectedModel(firstModel)
      }
    } catch (error) {
      console.error('Failed to fetch models:', error)
      setAvailableModels([])
    } finally {
      setIsLoadingModels(false)
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
    // Export selected chats to Excel
    const selectedChatData = chatHistory.filter(chat => selectedChats.includes(chat.id))
    const workbook = XLSX.utils.book_new()
    selectedChatData.forEach(chat => {
      const worksheet = XLSX.utils.json_to_sheet(chat.messages.map(msg => ({
        Timestamp: msg.timestamp.toISOString(),
        Role: msg.role,
        Content: msg.content
      })))
      XLSX.utils.book_append_sheet(workbook, worksheet, chat.title.replace(/[\/:*?"<>|]/g, '_'))
    })
    XLSX.writeFile(workbook, 'chat_export.xlsx')
    setSelectedChats([])
    setIsSelectionMode(false)
  }

  const unarchiveSelectedChats = () => {
    setChatHistory(prev => prev.map(chat =>
      selectedChats.includes(chat.id) && chat.isArchived
        ? { ...chat, isArchived: false }
        : chat
    ))
    setSelectedChats([])
    setIsSelectionMode(false)
    alert('Chats have been unarchived and moved back to chat history')
  }

  const clearAllHistory = () => {
    // Reset to initial state with one default chat
    const newChat: ChatHistory = {
      id: Date.now().toString(),
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

    setChatHistory([newChat])
    setCurrentChatId(newChat.id)
    setMessages(newChat.messages)
    setShowClearHistoryModal(false)
    setIsSelectionMode(false)
    setSelectedChats([])
  }

  const generateChatTitle = (messages: Message[]) => {
    const userMessages = messages.filter(m => m.role === 'user')
    if (userMessages.length > 0) {
      let title = userMessages[0].content.trim()

      // Remove common question words and clean up
      title = title.replace(/^(what|how|why|when|where|who|can|could|would|should|is|are|do|does|did|will|would)\s+/i, '')

      // Split into words and take first few meaningful words
      const words = title.split(/\s+/).filter(word => word.length > 0)
      if (words.length > 0) {
        // Take first 3-4 words or until we hit 20 characters
        let result = ''
        for (let i = 0; i < Math.min(words.length, 4); i++) {
          const nextWord = words[i]
          if (result.length + nextWord.length + 1 <= 20) {
            result += (result ? ' ' : '') + nextWord
          } else {
            break
          }
        }
        return result || 'New Chat'
      }
    }
    return 'New Chat'
  }

  // Handle model selection
  const handleModelChange = (model: string) => {
    setSelectedModel(model)

    // All available models from Ollama are integrated
    setModelSelectedMessage(`✅ ${model} has been selected and is ready to use`)

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
              className="text-gray-400 hover:text-white transition-colors lg:hidden glare-effect"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            <button
              onClick={createNewChat}
              className="w-full bg-green-600 hover:bg-green-700 shadow-2xl text-white px-4 py-2 rounded-full flex items-center justify-center space-x-2 transition-colors glare-effect"
            >
              <Icon icon='line-md:plus' className="w-4 h-4" />
              <span>New Chat</span>
            </button>
            <button
              onClick={() => setShowClearHistoryModal(true)}
              className="w-full bg-red-600 hover:bg-red-700 shadow-2xl text-white px-4 py-2 rounded-full flex items-center justify-center space-x-2 transition-colors glare-effect"
            >
              <Icon icon='line-md:close' className="w-4 h-4" />
              <span>Clear History</span>
            </button>
          </div>
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
                className="text-sm text-gray-400 hover:text-white glare-effect">
                
                Cancel
              </button>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={deleteSelectedChats}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center justify-center space-x-1 glare-effect">
                
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
              {selectedChats.some(id => chatHistory.find(chat => chat.id === id)?.isArchived) ? (
                <button
                  onClick={unarchiveSelectedChats}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center justify-center space-x-1 glare-effect">
                  
                  <ArchiveRestore className="w-3 h-3" />
                  <span>Unarchive</span>
                </button>
              ) : (
                <button
                  onClick={archiveSelectedChats}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm flex items-center justify-center space-x-1 glare-effect">
                  
                  <Archive className="w-3 h-3" />
                  <span>Archive</span>
                </button>
              )}
              <button
                onClick={shareSelectedChats}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center justify-center space-x-1 glare-effect">
                
                <Share2 className="w-3 h-3" />
                <span>Export</span>
              </button>
            </div>
          </div>
        )}

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {Object.entries(chatHistory
              .filter(chat => !chat.isArchived)
              .reduce((acc: Record<string, ChatHistory[]>, chat) => {
                const date = chat.lastMessage.toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
                if (!acc[date]) acc[date] = [];
                acc[date].push(chat);
                return acc;
              }, {})).map(([date, chats]) => (
              <div key={date} className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-300 mb-1">{date}</h3>
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`relative flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors ${chat.id === currentChatId ? 'bg-green-600 shadow-2xl border-2 border-white' : 'bg-gray-700 hover:bg-gray-600'
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
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium truncate flex-1 mr-2">{chat.title}</h3>
                        <p className="text-xs font-medium text-white whitespace-nowrap flex-shrink-0">
                          {chat.lastMessage.toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Archived Section */}
          {chatHistory.some(chat => chat.isArchived) && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Archived</h3>
                <button
                  onClick={() => setShowArchivedChats(!showArchivedChats)}
                  className="text-xs text-gray-400 hover:text-white transition-colors glare-effect"
                >
                  {showArchivedChats ? 'Hide' : 'Show'}
                </button>
              </div>
              {showArchivedChats && (
                <div className="space-y-1">
                  {chatHistory.filter(chat => chat.isArchived).map((chat) => (
                    <div
                      key={chat.id}
                      className="relative p-2 rounded-lg bg-gray-700 hover:bg-gray-600 cursor-pointer transition-colors opacity-60 group"
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
                        <div className="absolute top-1 right-1">
                          <div className={`w-3 h-3 rounded border-2 ${selectedChats.includes(chat.id)
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
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium truncate">{chat.title}</h3>
                          <p className=" text-xs text-gray-400 mt-0.5">
                            {chat.lastMessage.toLocaleDateString('en-GB', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setChatHistory(prev => prev.map(c =>
                              c.id === chat.id ? { ...c, isArchived: false } : c
                            ))
                            alert(`"${chat.title}" has been unarchived and moved back to chat history`)
                          }}
                          className="ml-2 p-1 rounded hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity glare-effect"
                          title="Unarchive chat"
                        >
                          <ArchiveRestore className="w-4 h-4 text-gray-400 hover:text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                className={`text-gray-400 hover:text-white transition-colors glare-effect ${isSidebarOpen ? 'lg:hidden' : ''}`}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold flex items-center space-x-3">
                <Icon icon='line-md:chat' className='w-6 h-6' />
                <span className="text-white">Local GPT</span>
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoadingModels || !isConnected}
              >
                {isLoadingModels ? (
                  <option value="">Loading models...</option>
                ) : availableModels.length === 0 ? (
                  <option value="">No models available</option>
                ) : (
                  availableModels.map((model) => {
                    const modelName = model.name.replace(':latest', '')
                    const displayName = modelName
                      .split(/[_-]|(?=[A-Z])/)
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')
                    return (
                      <option key={model.name} value={modelName}>
                        {displayName}
                      </option>
                    )
                  })
                )}
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
                  className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors glare-effect"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Model Selection Message */}
        {modelSelectedMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mx-4 mb-2">
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
                <MagicBento>
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
                </MagicBento>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-700 text-gray-100">
                  <div className="flex items-center justify-center">
                    <GlitchText text="Thinking..." className="text-sm text-gray-400" />
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
                className="bg-gray-600 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors glare-effect"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Icon icon='streamline:mail-send-email-message' className='w-12 h-12' />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clear History Confirmation Modal */}
      <Modal
        isOpen={showClearHistoryModal}
        onClose={() => setShowClearHistoryModal(false)}
        title="Clear Chat History"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-20 h-20  flex items-center justify-center">
              <Icon icon="line-md:alert" className="w-20 h-20 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Are you sure?</h3>
              <p className="text-sm text-white mt-1">
                This action will permanently delete all your chat history including archived chats. This cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={() => setShowClearHistoryModal(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg border-2 border-gray-700 transition-colors glare-effect"
            >
              Cancel
            </button>
            <button
              onClick={clearAllHistory}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg border-2 border-gray-700 transition-colors glare-effect "
            >
              Clear All History
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default App
