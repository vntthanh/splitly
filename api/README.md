# Splitly API Backend

A robust Node.js/Express API server for managing shared expenses, bill splitting, and group management. Built with MongoDB, Socket.IO, and comprehensive authentication system.

## 🚀 Features

### 🔐 **Authentication & Security**
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Account Verification**: Email-based account verification system
- **Password Security**: Bcrypt password hashing and validation
- **Role-based Access**: User permissions and authorization
- **CORS Configuration**: Cross-origin resource sharing setup

### 💰 **Bill Management**
- **3 Bill Types**: Equal split, by-person split, and item-based split
- **OCR Integration**: Vietnamese receipt scanning with Gemini 3 Flash
- **Auto Calculations**: Smart amount distribution algorithms
- **Payment Tracking**: Complete payment status monitoring
- **Opt-out System**: Users can remove themselves from bills
- **Email Notifications**: Automatic notifications for bill events

### 👥 **Group Management**
- **CRUD Operations**: Complete group lifecycle management
- **Member Management**: Add/remove group members with permissions
- **Group Statistics**: Expense tracking and analytics
- **Bulk Operations**: Handle multiple bills and members

### 🔔 **Real-time Features**
- **Socket.IO Integration**: Real-time notifications and updates
- **Multi-device Sync**: Notification state across devices
- **Live Updates**: Real-time bill and group changes
- **Event Broadcasting**: Targeted event delivery to users

### 📧 **Email System**
- **Brevo Integration**: Professional email service integration
- **Nodemailer Fallback**: Backup email system
- **Template System**: Rich HTML email templates
- **Payment Reminders**: Automated payment deadline notifications
- **Opt-out Emails**: Notification system for bill opt-outs

### 🤖 **AI Integration**
- **Clova Studio Provider**: AI-powered chatbot assistance
- **Gemini Provider**: Structured receipt OCR with Vietnamese diacritic support
- **Smart Suggestions**: AI-powered expense categorization

## 🛠 Tech Stack

- **Express.js** 5.1.0
- **MongoDB** 6.20.0 (native driver)
- **Joi** 18.0.1 (validation)
- **Babel** 7.28+ (transpilation)
- **dotenv** 17.2.3
- **Socket.IO** 4.8.1
- **JWT** 9.0.2 (jsonwebtoken)
- **Bcrypt** 3.0.3 (bcryptjs)
- **Sharp** 0.34.5 (image processing)
- **Brevo** 3.0.1 (email service)
- **Nodemailer** 7.0.10 (email fallback)

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB 6.0+
- npm or yarn

### Setup Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file:
   ```env
   # Server Configuration
   PORT=8017
   NODE_ENV=development
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/splitly
   DATABASE_NAME=splitly
   
   # JWT Secrets
   ACCESS_JWT_SECRET_KEY=your-access-secret-key
   REFRESH_JWT_SECRET_KEY=your-refresh-secret-key
   
   # Email Configuration (Brevo)
   BREVO_API_KEY=your-brevo-api-key
   BREVO_SENDER_EMAIL=noreply@yourdomain.com
   BREVO_SENDER_NAME=Splitly
   
   # Email Fallback (Nodemailer)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # Frontend URLs
   WEBSITE_DOMAIN=http://localhost:5173
   
   # Gemini receipt OCR (API key from Google AI Studio)
   GEMINI_API_KEY=your-google-ai-studio-api-key
   GEMINI_MODEL=gemini-3-flash-preview
   GEMINI_TIMEOUT_MS=60000

   # Optional Clova chatbot integration
   NCP_API_KEY=your-naver-cloud-api-key
   NCP_CLOVASTUDIO_ENDPOINT=your-clova-studio-endpoint
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Production server**
   ```bash
   npm start
   ```

## 🏗 Project Structure

```
api/
├── src/
│   ├── config/              # Configuration files
│   │   ├── cors.js          # CORS configuration
│   │   ├── environment.js   # Environment variables
│   │   ├── initDB.js        # Database initialization
│   │   └── mongodb.js       # MongoDB connection
│   ├── controllers/         # Route controllers
│   │   ├── authController.js
│   │   ├── billController.js
│   │   ├── groupController.js
│   │   ├── userController.js
│   │   ├── notificationController.js
│   │   ├── debtController.js
│   │   └── ...
│   ├── middlewares/         # Express middlewares
│   │   ├── authMiddleware.js
│   │   └── errorHandlingMiddleware.js
│   ├── models/              # Database models
│   │   ├── userModel.js
│   │   ├── billModel.js
│   │   ├── groupModel.js
│   │   ├── notificationModel.js
│   │   └── ...
│   ├── providers/           # External service providers
│   │   ├── BrevoEmailProvider.js
│   │   ├── ClovaStudioProvider.js
│   │   ├── GeminiProvider.js
│   │   ├── JwtProvider.js
│   │   └── NodemailerProvider.js
│   ├── routes/              # API routes
│   │   ├── v1/              # Version 1 API routes
│   │   └── v2/              # Version 2 API routes
│   ├── services/            # Business logic layer
│   │   ├── billService.js
│   │   ├── groupService.js
│   │   ├── userService.js
│   │   ├── notificationService.js
│   │   └── ...
│   ├── sockets/             # Socket.IO handlers
│   │   └── notificationSocket.js
│   ├── utils/               # Utility functions
│   │   ├── algorithms.js
│   │   ├── constants.js
│   │   ├── emailService.js
│   │   ├── emailTemplates.js
│   │   ├── formatters.js
│   │   ├── tools.js
│   │   └── APIError.js
│   ├── validations/         # Input validation schemas
│   └── server.js            # Application entry point
├── scripts/                 # Utility scripts
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/v1/users/register` - User registration
- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/logout` - User logout
- `POST /api/v1/users/refresh-token` - Refresh JWT token
- `GET /api/v1/users/verify/:token` - Email verification

### Bills
- `POST /api/v1/bills` - Create new bill
- `GET /api/v1/bills/user/:userId` - Get bills by user
- `GET /api/v1/bills/:billId` - Get bill details
- `PUT /api/v1/bills/:billId` - Update bill
- `DELETE /api/v1/bills/:billId` - Delete bill
- `POST /api/v1/bills/scan` - OCR bill scanning
- `GET /api/v1/bills/opt-out` - Opt out from bill

### Groups
- `POST /api/v1/groups` - Create group
- `GET /api/v1/groups` - Get all groups
- `GET /api/v1/groups/:groupId` - Get group details
- `PUT /api/v1/groups/:id` - Update group
- `DELETE /api/v1/groups/:id` - Delete group
- `GET /api/v1/groups/:groupId/members` - Get group members

### Notifications
- `GET /api/v1/notifications` - Get user notifications
- `PUT /api/v1/notifications/:id/read` - Mark as read
- `PUT /api/v1/notifications/read-all` - Mark all as read
- `DELETE /api/v1/notifications/:id` - Delete notification

### Debts
- `GET /api/v1/debts/user/:userId` - Get user debts
- `POST /api/v1/debts/pay` - Record payment
- `GET /api/v1/debts/summary/:userId` - Get debt summary

## 🔌 Socket.IO Events

### Client to Server Events
- `FE_JOIN_NOTIFICATION_ROOM` - Join user notification room
- `FE_LEAVE_NOTIFICATION_ROOM` - Leave notification room
- `FE_MARK_NOTIFICATION_READ` - Mark notification as read
- `FE_MARK_ALL_NOTIFICATIONS_READ` - Mark all as read

### Server to Client Events
- `BE_NEW_NOTIFICATION` - New notification received
- `BE_NOTIFICATION_READ` - Notification marked as read
- `BE_ALL_NOTIFICATIONS_READ` - All notifications read

## 🔧 Development

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run lint       # Run ESLint
npm test           # Run tests
```

### Environment Variables

Required environment variables:
- `MONGODB_URI` - MongoDB connection string
- `ACCESS_JWT_SECRET_KEY` - JWT access token secret
- `REFRESH_JWT_SECRET_KEY` - JWT refresh token secret
- `BREVO_API_KEY` - Brevo email service API key
- `WEBSITE_DOMAIN` - Frontend domain for CORS and email links

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**
   ```env
   NODE_ENV=production
   PORT=8017
   MONGODB_URI=mongodb://your-production-db
   ```

2. **Process Management**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start src/server.js --name "splitly-api"
   ```

3. **Database Migration**
   ```bash
   node scripts/seedActivities.mjs
   ```

---

### Environment Setup

Create a `.env` file in the root of `api/` directory:

```
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=bill_sharing_app
APP_HOST=localhost
APP_PORT=8080
BUILD_MODE=dev
```

### Run Development Server

```bash
npm run dev
```

The API will run at http://localhost:8080

### Other Scripts

```bash
npm run build       # Build with Babel
npm run start       # Run production build
npm run production  # Build and run in production mode
npm run lint        # Run ESLint
```

## Project Structure

```
src/
├── server.js           # Express server entry point
├── config/             # Configuration (MongoDB, environment)
├── routes/             # API routes (v1, v2)
├── controllers/        # Request handlers
├── services/           # Business logic layer
├── models/             # Data models
├── validations/        # Joi validation schemas
├── middlewares/        # Express middlewares
└── utils/              # Utility functions
```

## API Endpoints

### v1

- `GET /v1/status` - Health check
- `POST /v1/boards` - Create new board

## Features

- MongoDB connection with Singleton pattern
- Joi validation middleware
- Global error handling
