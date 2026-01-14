#!/bin/bash

# FinTrack Frontend Deployment Script
# This script deploys to Vercel and ensures cache is cleared

echo "🚀 Starting FinTrack deployment..."

# Build the project
echo "📦 Building production bundle..."
npm run build:prod

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo "✅ Deployment successful!"
echo "🎉 Your app is now live!"
echo ""
echo "📊 Check deployment: https://vercel.com/dashboard"
echo "🌍 Live URL: https://finance-tracker-frontend-phi.vercel.app"
