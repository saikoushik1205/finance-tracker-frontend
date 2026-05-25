@echo off
REM FinTrack Frontend Deployment Script for Windows
REM This script deploys to Vercel and ensures cache is cleared

echo 🚀 Starting FinTrack deployment...

REM Build the project
echo 📦 Building production bundle...
call npm run build:prod

if errorlevel 1 (
    echo ❌ Build failed!
    exit /b 1
)

echo ✅ Build successful!

REM Deploy to Vercel
echo 🌐 Deploying to Vercel...
call vercel --prod

if errorlevel 1 (
    echo ❌ Deployment failed!
    exit /b 1
)

echo ✅ Deployment successful!
echo 🎉 Your app is now live!
echo.
echo 📊 Check deployment: https://vercel.com/dashboard
echo 🌍 Live URL: https://finance-tracker-frontend-phi.vercel.app

pause
