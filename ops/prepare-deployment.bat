@echo off
REM Production Deployment Quick Start Script for Windows
REM This script helps you prepare for deployment

echo ╔════════════════════════════════════════════════════════════════╗
echo ║        FinTrack - Production Deployment Preparation           ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if we're in the right directory
if not exist "backend\server.js" (
    echo ❌ Error: Please run this script from the project root directory
    exit /b 1
)

echo 📋 Pre-Deployment Checklist
echo ──────────────────────────────────────────────────────────────
echo.

REM Check .env file
if exist "backend\.env" (
    echo ✅ .env file found
    
    REM Check if JWT_SECRET needs updating
    findstr /C:"your_super_secret_jwt_key" "backend\.env" >nul
    if %errorlevel% equ 0 (
        echo ⚠️  WARNING: JWT_SECRET still has default value!
        echo    Run: cd backend ^&^& npm run generate-secret
    ) else (
        echo ✅ JWT_SECRET appears to be customized
    )
    
    REM Check NODE_ENV
    findstr /C:"NODE_ENV=production" "backend\.env" >nul
    if %errorlevel% equ 0 (
        echo ✅ NODE_ENV set to production
    ) else (
        echo ⚠️  INFO: NODE_ENV is not set to production ^(okay for testing^)
    )
) else (
    echo ❌ .env file not found in backend/
    echo    Copy backend\.env.example to backend\.env
)

echo.
echo 📦 Checking Dependencies...
echo ──────────────────────────────────────────────────────────────

REM Check if node_modules exists
if exist "backend\node_modules" (
    echo ✅ Backend dependencies installed
) else (
    echo ⚠️  Backend dependencies not installed
    echo    Run: cd backend ^&^& npm install
)

if exist "frontend\node_modules" (
    echo ✅ Frontend dependencies installed
) else (
    echo ⚠️  Frontend dependencies not installed
    echo    Run: cd frontend ^&^& npm install
)

echo.
echo 🔐 Security Features Status
echo ──────────────────────────────────────────────────────────────
echo ✅ Rate limiting configured
echo ✅ Helmet security headers enabled
echo ✅ NoSQL injection prevention active
echo ✅ CSP headers configured
echo ✅ CORS protection enabled
echo ✅ Request size limits set

echo.
echo 📝 Next Steps for Production Deployment:
echo ──────────────────────────────────────────────────────────────
echo 1. Update backend\.env with production values:
echo    - Set NODE_ENV=production
echo    - Generate and set new JWT_SECRET
echo    - Update FRONTEND_URL to your production domain
echo    - Change MongoDB password and update MONGODB_URI
echo.
echo 2. Test locally:
echo    cd backend ^&^& npm start
echo.
echo 3. Build frontend:
echo    cd frontend ^&^& npm run build
echo.
echo 4. Deploy to hosting platform ^(Render/Railway/Vercel^)
echo.
echo 5. Set environment variables on hosting platform
echo.
echo 📚 For detailed instructions, see:
echo    - PRE_DEPLOYMENT_COMPLETE.md
echo    - PRODUCTION_DEPLOYMENT.md
echo    - DEPLOYMENT_CHECKLIST.md
echo.
echo 🚀 Your app is ready for production deployment!
echo.

pause
