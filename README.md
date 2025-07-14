# Local GPT - ChatGPT-like Interface with Ollama

A modern, responsive chat interface built with React, TypeScript, and Tailwind CSS that connects to your local Ollama instance for AI-powered conversations.

## Features

- 🎨 **Modern ChatGPT-like UI** - Clean, responsive design with dark theme
- 🤖 **Ollama Integration** - Direct connection to local Ollama service
- ☁️ **Cloud AI Fallback** - Uses OpenAI GPT when Ollama is unavailable
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔄 **Smart AI Detection** - Automatically switches between local and cloud AI
- 🗃️ **Archive/Unarchive Chats** - Easily manage your chat history with archiving
- 📊 **Excel Export** - Export chats with a single click
- 💾 **Persistent History** - Automatic save and load chat history
- 💬 **Message History** - Persistent conversation history
- ⚡ **TypeScript** - Full type safety
- 🎨 **Tailwind CSS** - Utility-first styling
- 🚀 **Vercel Ready** - Optimized for Vercel deployment

## New Features Implementation

### Archive/Unarchive Chats
Manage your chats with an intuitive archive and unarchive functionality. Archived chats can be hidden or shown and restored easily.

### Excel Export
Export your chats to Excel format with a single click. Each chat is stored as a separate sheet for better organization.

### Persistent History
Chat history is automatically saved and restored across sessions using localStorage, ensuring continuous and seamless user experience.

## Prerequisites

Before running this application, you need to have:

1. **Node.js** (v18 or higher)
2. **Ollama** installed and running on your machine
3. At least one AI model downloaded via Ollama

### Installing Ollama

1. Visit [Ollama's website](https://ollama.ai/) and download the installer
2. Install Ollama on your system
3. Pull a model (e.g., `ollama pull llama2`)
4. Start the Ollama service (usually runs automatically)

### Verifying Ollama Installation

```bash
# Check if Ollama is running
curl http://localhost:11434/api/version

# List available models
ollama list

# Pull a model if you haven't already
ollama pull llama2
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. (Optional) Configure Cloud AI Fallback

For cloud deployment or when Ollama isn't available, you can configure OpenAI as a fallback:

```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3. Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

## Usage

### Chat Management

#### Archive/Unarchive Chats
1. **Archive**: Right-click on any chat → Select multiple chats → Click "Archive" button
2. **View Archived**: Click "Show" button next to "Archived" section in sidebar
3. **Unarchive Individual**: Hover over archived chat → Click restore icon
4. **Unarchive Multiple**: Select archived chats → Click "Unarchive" button

#### Export to Excel
1. Enter selection mode by right-clicking on any chat
2. Select one or more chats you want to export
3. Click the "Export" button
4. Excel file `chat_export.xlsx` will be downloaded automatically
5. Each chat becomes a separate worksheet with timestamp, role, and content

#### Persistent History
- Chat history is automatically saved to browser's localStorage
- No manual action required - works seamlessly across sessions
- Handles app restarts and browser refreshes gracefully

### Model Selection
- Use the dropdown in the header to switch between available Ollama models
- Models are dynamically loaded from your local Ollama instance
- Visual feedback shows connection status and selected model

## Deployment

### Vercel Deployment

This project is optimized for Vercel deployment:

1. **Connect to Vercel:**
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

2. **Or deploy via Vercel Dashboard:**
   - Go to [vercel.com](https://vercel.com)
   - Import your Git repository
   - Add environment variable: `VITE_OPENAI_API_KEY` (optional)
   - Deploy automatically

3. **Environment Variables on Vercel:**
   - In your Vercel dashboard, go to Settings > Environment Variables
   - Add `VITE_OPENAI_API_KEY` with your OpenAI API key
   - This enables cloud AI when users don't have Ollama running locally

## Project Structure

```
Local GPT/
├── src/
│   ├── services/
│   │   └── ollamaService.ts    # Ollama API integration
│   ├── App.tsx                 # Main application component
│   ├── App.css                 # Component styles
│   ├── index.css               # Global styles & Tailwind
│   └── main.tsx                # Application entry point
├── public/                     # Static assets
├── vercel.json                 # Vercel configuration
├── tailwind.config.js          # Tailwind configuration
├── postcss.config.js           # PostCSS configuration
└── vite.config.ts              # Vite configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Configuration

### Ollama Settings

The default configuration connects to Ollama at `http://localhost:11434` using the `llama2` model. You can customize this by modifying the `OllamaService` instantiation in `src/App.tsx`.

### Tailwind Customization

The app includes custom color schemes in `tailwind.config.js`. You can modify these to match your preferences.

## Troubleshooting

### Ollama Connection Issues

1. **"Ollama service is not running"**
   - Ensure Ollama is installed and running
   - Check if the service is accessible: `curl http://localhost:11434/api/version`

2. **"Model not found"**
   - Pull the required model: `ollama pull llama2`
   - Verify available models: `ollama list`

3. **CORS Issues**
   - Ollama typically allows localhost connections by default
   - If you encounter CORS issues, check Ollama's configuration

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **AI Integration**: Ollama
- **Deployment**: Vercel
- **Icons**: Lucide React
- **Excel Export**: xlsx library
- **Storage**: localStorage for persistence

---

**Note**: This application requires Ollama to be running locally for AI functionality. When deployed to Vercel, the chat interface will work, but AI responses will only function when users have Ollama running on their local machines.
