# FinTrack - Personal Finance Tracker

A comprehensive full-stack personal finance tracking application built with Angular and Node.js.

## 🚀 Features

- **Lending & Borrowing**: Track money you've lent to or borrowed from others
- **Expenses & Earnings**: Monitor your spending and income by categories
- **Interest Calculation**: Automatically calculate interest on loans
- **Dashboard Analytics**: Visual overview of your financial status
- **Secure Authentication**: JWT-based user authentication
- **Responsive Design**: Works seamlessly on desktop and mobile

## 🛠️ Tech Stack

### Frontend

- Angular 17+
- TypeScript
- RxJS
- Angular Router

### Backend

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcrypt for password hashing

## 📋 Prerequisites

- Node.js (v20 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

## 🔧 Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/saikoushik1205/fin-tracker.git
cd fin-tracker
```

### 2. Install dependencies

```bash
# Install root dependencies
npm install

# Install all dependencies (frontend + backend)
npm run install-all
```

### 3. Environment Configuration

Create a `.env` file in the `backend` directory:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:4200
```

### 4. Start the application

```bash
# Start both frontend and backend
npm start

# Or start individually:
# Frontend: npm run frontend
# Backend: npm run backend
```

The application will be available at:

- Frontend: http://localhost:4200
- Backend API: http://localhost:3000/api

## 🌐 Deployment

### Deploy to Vercel

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

Quick deployment:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Environment Variables for Production

Set these in your Vercel project settings:

- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secure JWT secret (min 32 characters)
- `JWT_EXPIRES_IN` - Token expiration (e.g., "7d")
- `NODE_ENV` - Set to "production"
- `FRONTEND_URL` - Your Vercel app URL

## 📁 Project Structure

```
fintrack-app/
├── frontend/                # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/       # Guards, interceptors, services
│   │   │   ├── features/   # Feature modules (auth, dashboard, etc.)
│   │   │   ├── models/     # TypeScript interfaces
│   │   │   └── shared/     # Shared components
│   │   └── environments/   # Environment configs
│   └── package.json
├── backend/                 # Express backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth & validation middleware
│   │   ├── models/         # Mongoose models
│   │   └── routes/         # API routes
│   ├── server.js           # Server entry point
│   └── package.json
└── package.json            # Root package.json
```

## 🔐 Test Credentials

For testing purposes (see TEST_CREDENTIALS.md):

```
Email: test@example.com
Password: Test123!
```

## 📝 API Documentation

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Persons

- `GET /api/persons` - Get all persons
- `POST /api/persons` - Create new person
- `PUT /api/persons/:id` - Update person
- `DELETE /api/persons/:id` - Delete person

### Transactions

- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Dashboard

- `GET /api/dashboard/stats` - Get dashboard statistics

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Sai Koushik**

- GitHub: [@saikoushik1205](https://github.com/saikoushik1205)

## 🙏 Acknowledgments

- Angular team for the amazing framework
- Express.js community
- MongoDB for the database solution

---

For detailed setup and deployment instructions, see:

- [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
