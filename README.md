# 💰 FinTrack - Advanced Personal Financial Tracker

A production-ready, modern full-stack financial tracking web application with stunning UI, animations, and comprehensive features.

## 🚀 Tech Stack

### Frontend

- **Angular** (Latest, Standalone Components)
- **TypeScript**
- **RxJS**
- **Firebase Authentication**
- **Chart.js / ng2-charts**
- **jsPDF / pdfMake** (PDF Export)

### Backend

- **Node.js** (Latest LTS)
- **Express.js**
- **MongoDB** (Mongoose)
- **JWT** (API Protection)
- **Firebase Admin SDK**

## 📁 Project Structure

```
fintrack-app/
├── frontend/              # Angular Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/     # Services, Guards, Interceptors
│   │   │   ├── shared/   # Reusable Components
│   │   │   ├── features/ # Feature Modules
│   │   │   └── models/   # TypeScript Interfaces
│   │   ├── assets/       # Static Assets
│   │   └── environments/ # Environment Config
├── backend/              # Node.js API
│   ├── src/
│   │   ├── models/       # MongoDB Schemas
│   │   ├── routes/       # API Routes
│   │   ├── middleware/   # Auth & Validation
│   │   ├── controllers/  # Business Logic
│   │   └── utils/        # Utilities
│   └── server.js         # Entry Point
└── package.json          # Root Package File
```

## ✨ Core Features

### 📊 Dashboard

- Financial overview with animated counters
- Net balance visualization
- Interactive charts (money flow, distribution)
- Smooth page transitions

### 💸 Financial Modules

- **Lending** - Track money lent to others
- **Borrowing** - Track money borrowed
- **Earnings** - Income tracking by source
- **Expenses** - Expense tracking by vendor/category
- **Interest** - Interest calculation (restricted access)
- **Other** - Cash & Bank balance tracking

### 🔐 Authentication

- Firebase Google Sign-In
- Email & Password Authentication
- Account Linking (prevent duplicates)
- Secure JWT token validation

### 📄 PDF Export

- Generate professional PDFs per person
- Include all transactions and totals
- Branded layout with timestamps

### 🎨 UI/UX

- Dark fintech theme
- Glassmorphism effects
- Neon accents & gradients
- Hover & micro-interactions
- Motion-based transitions
- Fully responsive

## 🔧 Installation & Setup

### Prerequisites

- Node.js (v20+ LTS)
- MongoDB (Local or Atlas)
- Firebase Project (Authentication enabled)
- npm or yarn

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/fintrack-app.git
cd fintrack-app
```

### 2. Install Dependencies

```bash
npm run install-all
```

### 3. Backend Configuration

Create `backend/.env`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/fintrack
JWT_SECRET=your_super_secret_jwt_key_change_in_production
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NODE_ENV=development
```

### 4. Frontend Configuration

Create `frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000/api",
  firebase: {
    apiKey: "your-api-key",
    authDomain: "your-app.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-app.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id",
  },
};
```

### 5. Start Application

```bash
# Start both frontend and backend
npm start

# Or separately:
# Backend (http://localhost:3000)
npm run backend

# Frontend (http://localhost:4200)
npm run frontend
```

## 🗄️ Database Schema

### User

```javascript
{
  uid: String (Firebase UID),
  email: String,
  displayName: String,
  providers: [String], // ['google', 'email']
  createdAt: Date,
  updatedAt: Date
}
```

### Person

```javascript
{
  userId: ObjectId (ref: User),
  name: String,
  email: String (optional),
  phone: String (optional),
  sectionType: String, // 'lending', 'borrowing', 'earnings', 'expenses', 'interest'
  createdAt: Date
}
```

### Transaction

```javascript
{
  personId: ObjectId (ref: Person),
  userId: ObjectId (ref: User),
  date: Date,
  amount: Number,
  remarks: String,
  status: String, // 'pending', 'completed', 'partial'
  type: String (optional),
  createdAt: Date
}
```

### CashBank

```javascript
{
  userId: ObjectId (ref: User),
  cash: Number,
  bank: Number,
  updatedAt: Date
}
```

## 🔒 Security Features

- Firebase Authentication
- JWT token validation
- HTTP-only cookies (optional)
- Route guards
- API rate limiting
- Input validation & sanitization
- CORS configuration
- Environment-based secrets

## 🎯 Key Business Rules

1. **Person-Transaction Model**: Each person can have multiple transactions. No duplicate persons.
2. **Interest Section Visibility**: Only visible for `koushiksai242@gmail.com`.
3. **Account Linking**: Google and Email accounts with same email are automatically linked.
4. **No Data Loss**: All authentication changes preserve existing data.
5. **PDF Export**: Available for every person in every section.

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test

# E2E tests
cd frontend
npm run e2e
```

## 📦 Deployment

### Vercel (Frontend)

```bash
cd frontend
npm run build
vercel deploy --prod
```

### Backend Deployment Options

- **Heroku**
- **Railway**
- **AWS EC2**
- **DigitalOcean**
- **Render**

### Environment Variables (Production)

- Update `environment.prod.ts` with production API URL
- Set all backend environment variables in hosting platform
- Enable Firebase Authentication for production domain

## 🐛 Troubleshooting

### Firebase Authentication Issues

- Verify Firebase config in `environment.ts`
- Check authorized domains in Firebase Console
- Ensure service account key is valid

### MongoDB Connection

- Verify MongoDB is running
- Check connection string format
- Ensure network access (if using Atlas)

### PDF Generation

- Check browser compatibility
- Verify PDF library is installed
- Test with smaller datasets first

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📧 Contact

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using Angular, Node.js, and MongoDB**
