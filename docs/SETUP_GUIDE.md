# FinTrack Setup Guide - JWT Authentication

## Overview

Firebase has been completely removed from the project. The app now uses JWT (JSON Web Token) authentication with MongoDB for data persistence.

## Features

✅ **JWT-based authentication** - Secure token-based auth
✅ **MongoDB storage** - All data persists in MongoDB
✅ **Password hashing** - bcrypt for secure password storage
✅ **Cross-device login** - Access your data from anywhere
✅ **No local storage dependency** - Data always syncs with backend

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/fintrack
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars
JWT_EXPIRES_IN=7d

# CORS (Frontend URL)
FRONTEND_URL=http://localhost:4200
```

**IMPORTANT:** Change `JWT_SECRET` to a random, complex string (minimum 32 characters).

### 3. Start MongoDB

Make sure MongoDB is running:

```bash
# Windows
mongod

# Or if using MongoDB service
net start MongoDB
```

### 4. Start Backend Server

```bash
npm run dev
```

The server will run on http://localhost:3000

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Frontend

```bash
npm start
```

The app will run on http://localhost:4200

## First Time Setup

### 1. Create an Account

- Navigate to http://localhost:4200
- Click "Sign Up"
- Enter your details (name, email, password)
- Click "Create Account"

### 2. Start Using the App

After registration, you'll be automatically logged in and redirected to the dashboard.

## Authentication Flow

1. **Registration**: User creates account → Password is hashed → User stored in MongoDB
2. **Login**: User enters credentials → Password verified → JWT token generated → Token stored in localStorage
3. **API Requests**: Token sent in Authorization header → Backend verifies token → Request processed
4. **Logout**: Token removed from localStorage → User redirected to login

## Data Persistence

All data is stored in MongoDB:

- **Users Collection**: User accounts, hashed passwords
- **Persons Collection**: Income sources, expense categories, contacts
- **Transactions Collection**: All financial transactions
- **CashBank Collection**: Cash/Bank balances per user

**Your data is accessible from any device after logging in with your credentials.**

## API Endpoints

### Public Routes

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Protected Routes (Require JWT Token)

- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/dashboard` - Get dashboard data
- `GET /api/persons` - Get all persons
- `POST /api/persons` - Create person
- `GET /api/transactions` - Get transactions
- `POST /api/transactions` - Create transaction
- And more...

## Security Features

1. **Password Hashing**: bcrypt with salt rounds
2. **JWT Tokens**: Signed tokens with expiration
3. **Protected Routes**: Middleware validates tokens
4. **CORS Protection**: Only frontend URL allowed
5. **Rate Limiting**: Prevents brute force attacks
6. **Helmet**: Security headers
7. **Input Validation**: Express-validator

## Troubleshooting

### Backend Issues

**MongoDB connection failed:**

```bash
# Check MongoDB is running
mongosh
# or
mongo
```

**JWT_SECRET not set:**

- Make sure `.env` file exists in backend directory
- Verify JWT_SECRET is set and has minimum 32 characters

**Port already in use:**

```bash
# Change PORT in .env file
PORT=3001
```

### Frontend Issues

**Cannot connect to backend:**

- Verify backend is running on http://localhost:3000
- Check `frontend/src/environments/environment.ts`:
  ```typescript
  apiUrl: "http://localhost:3000/api";
  ```

**Login/Register not working:**

- Check browser console for errors
- Verify backend is running
- Check network tab for API responses

## Migration from Firebase

If you had existing Firebase users, you'll need to:

1. **Export user data** from Firebase (if you had any)
2. **Users must re-register** with the new JWT system
3. All new data will be stored in MongoDB

## Production Deployment

### Backend

1. Set strong JWT_SECRET (64+ characters)
2. Update MONGODB_URI to production database
3. Set NODE_ENV=production
4. Update FRONTEND_URL to production domain
5. Use HTTPS
6. Set JWT_EXPIRES_IN appropriately (e.g., 7d, 30d)

### Frontend

1. Update `environment.prod.ts`:
   ```typescript
   apiUrl: "https://your-api-domain.com/api";
   ```
2. Build for production: `npm run build`
3. Deploy `dist/` folder

## Support

For issues or questions:

1. Check this guide first
2. Verify all environment variables are set
3. Check MongoDB is running
4. Review browser console and terminal logs
