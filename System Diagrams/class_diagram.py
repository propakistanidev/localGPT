"""
Class Diagram for ChatGPT-like Project
Generate using: python -m plantuml class_diagram.py
"""

plantuml_code = """
@startuml ChatGPT_Class_Diagram
!define RECTANGLE class

package "Frontend" {
    class ChatInterface {
        -messages: Message[]
        -currentInput: string
        -isLoading: boolean
        +sendMessage(content: string): void
        +displayMessage(message: Message): void
        +clearChat(): void
        +toggleTheme(): void
    }
    
    class Message {
        -id: string
        -content: string
        -sender: string
        -timestamp: Date
        -type: MessageType
        +getMessage(): string
        +getTimestamp(): Date
    }
    
    class MessageComponent {
        -message: Message
        -isUser: boolean
        +render(): JSX.Element
        +formatMessage(): string
    }
    
    class ChatHistory {
        -conversations: Conversation[]
        +saveConversation(conv: Conversation): void
        +loadConversation(id: string): Conversation
        +deleteConversation(id: string): void
    }
    
    class Conversation {
        -id: string
        -title: string
        -messages: Message[]
        -createdAt: Date
        +addMessage(message: Message): void
        +getMessages(): Message[]
    }
}

package "Backend API" {
    class ChatController {
        -ollamaService: OllamaService
        +handleChatRequest(req: ChatRequest): ChatResponse
        +getModels(): Model[]
        +healthCheck(): HealthStatus
    }
    
    class OllamaService {
        -baseUrl: string
        -model: string
        -timeout: number
        +generateResponse(prompt: string): string
        +listModels(): Model[]
        +pullModel(modelName: string): void
        +checkConnection(): boolean
    }
    
    class Model {
        -name: string
        -size: number
        -modified: Date
        -digest: string
        +getInfo(): ModelInfo
    }
    
    class ChatRequest {
        -message: string
        -conversationId: string
        -model: string
        +validate(): boolean
    }
    
    class ChatResponse {
        -response: string
        -model: string
        -timestamp: Date
        -tokensUsed: number
        +toJSON(): object
    }
}

package "Utils" {
    class ApiClient {
        -baseUrl: string
        +post(endpoint: string, data: object): Promise
        +get(endpoint: string): Promise
        +handleError(error: Error): void
    }
    
    class ConfigManager {
        -apiUrl: string
        -modelName: string
        +getConfig(): Config
        +setModel(modelName: string): void
    }
    
    class ErrorHandler {
        +handleApiError(error: Error): string
        +logError(error: Error): void
    }
}

' Relationships
ChatInterface --> Message
ChatInterface --> MessageComponent
ChatInterface --> ChatHistory
ChatInterface --> ApiClient
ChatHistory --> Conversation
Conversation --> Message
MessageComponent --> Message
ChatController --> OllamaService
ChatController --> ChatRequest
ChatController --> ChatResponse
OllamaService --> Model
ApiClient --> ErrorHandler
ChatInterface --> ConfigManager

@enduml
"""

# Save to file
with open('/Users/mazharali/Desktop/class_diagram.puml', 'w') as f:
    f.write(plantuml_code)

print("Class diagram saved to Desktop/class_diagram.puml")
