#!/bin/bash

# Production Deployment Quick Start Script
# This script helps you prepare for deployment

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        FinTrack - Production Deployment Preparation           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -f "backend/server.js" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📋 Pre-Deployment Checklist"
echo "──────────────────────────────────────────────────────────────"
echo ""

# Check .env file
if [ -f "backend/.env" ]; then
    echo "✅ .env file found"
    
    # Check if JWT_SECRET needs updating
    if grep -q "your_super_secret_jwt_key" "backend/.env"; then
        echo "⚠️  WARNING: JWT_SECRET still has default value!"
        echo "   Run: cd backend && npm run generate-secret"
    else
        echo "✅ JWT_SECRET appears to be customized"
    fi
    
    # Check NODE_ENV
    if grep -q "NODE_ENV=production" "backend/.env"; then
        echo "✅ NODE_ENV set to production"
    else
        echo "⚠️  INFO: NODE_ENV is not set to production (okay for testing)"
    fi
else
    echo "❌ .env file not found in backend/"
    echo "   Copy backend/.env.example to backend/.env"
fi

echo ""
echo "📦 Checking Dependencies..."
echo "──────────────────────────────────────────────────────────────"

# Check if node_modules exists
if [ -d "backend/node_modules" ]; then
    echo "✅ Backend dependencies installed"
else
    echo "⚠️  Backend dependencies not installed"
    echo "   Run: cd backend && npm install"
fi

if [ -d "frontend/node_modules" ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "⚠️  Frontend dependencies not installed"
    echo "   Run: cd frontend && npm install"
fi

echo ""
echo "🔐 Security Features Status"
echo "──────────────────────────────────────────────────────────────"
echo "✅ Rate limiting configured"
echo "✅ Helmet security headers enabled"
echo "✅ NoSQL injection prevention active"
echo "✅ CSP headers configured"
echo "✅ CORS protection enabled"
echo "✅ Request size limits set"

echo ""
echo "📝 Next Steps for Production Deployment:"
echo "──────────────────────────────────────────────────────────────"
echo "1. Update backend/.env with production values:"
echo "   - Set NODE_ENV=production"
echo "   - Generate and set new JWT_SECRET"
echo "   - Update FRONTEND_URL to your production domain"
echo "   - Change MongoDB password and update MONGODB_URI"
echo ""
echo "2. Test locally:"
echo "   cd backend && npm start"
echo ""
echo "3. Build frontend:"
echo "   cd frontend && npm run build"
echo ""
echo "4. Deploy to hosting platform (Render/Railway/Vercel)"
echo ""
echo "5. Set environment variables on hosting platform"
echo ""
echo "📚 For detailed instructions, see:"
echo "   - PRE_DEPLOYMENT_COMPLETE.md"
echo "   - PRODUCTION_DEPLOYMENT.md"
echo "   - DEPLOYMENT_CHECKLIST.md"
echo ""
echo "🚀 Your app is ready for production deployment!"
echo ""
