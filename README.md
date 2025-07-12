# Local GPT - ChatGPT-like Interface with Ollama

A modern, responsive chat interface built with React, TypeScript, and Tailwind CSS that connects to your local Ollama instance for AI-powered conversations.

## Features

- 🎨 **Modern ChatGPT-like UI** - Clean, responsive design with dark theme
- 🤖 **Ollama Integration** - Direct connection to local Ollama service
- ☁️ **Cloud AI Fallback** - Uses OpenAI GPT when Ollama is unavailable
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔄 **Smart AI Detection** - Automatically switches between local and cloud AI
- 💬 **Message History** - Persistent conversation history
- ⚡ **TypeScript** - Full type safety
- 🎨 **Tailwind CSS** - Utility-first styling
- 🚀 **Vercel Ready** - Optimized for Vercel deployment

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

---

**Note**: This application requires Ollama to be running locally for AI functionality. When deployed to Vercel, the chat interface will work, but AI responses will only function when users have Ollama running on their local machines.
