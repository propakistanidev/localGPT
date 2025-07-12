#!/bin/bash

# Local GPT - Deployment Script
# This script helps deploy the application to Vercel

echo "🚀 Local GPT - Deployment Script"
echo "=================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Your app is now live on Vercel"
echo "2. Make sure Ollama is running locally on your machine"
echo "3. Visit your deployed URL to test the application"
echo ""
echo "💡 Remember: The AI functionality requires Ollama to be running"
echo "   on the user's local machine at http://localhost:11434"
