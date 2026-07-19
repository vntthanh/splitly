# 💸 Splitly - Smart Expense Sharing Platform

A modern, full-stack expense sharing application that makes splitting bills with friends, family, and groups effortless. Built for the **Naver AI Hackathon** with Vietnamese localization and AI-powered features.

<div align="center">
  
  ![Splitly Banner](https://img.shields.io/badge/Splitly-Expense%20Sharing-E57373?style=for-the-badge&logo=react&logoColor=white)
  
  [![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=flat&logo=react)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-6.20-47A248?style=flat&logo=mongodb)](https://mongodb.com/)
  [![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-010101?style=flat&logo=socket.io)](https://socket.io/)
  [![Naver AI](https://img.shields.io/badge/Naver%20AI-Hackathon-00C73C?style=flat&logo=naver)](https://www.navercorp.com/)
  
</div>

## 🌟 **What Makes Splitly Special**

- 🇻🇳 **Vietnamese Localized**: Built specifically for Vietnamese users with complete language support
- 🤖 **AI-Powered**: Clova Studio integration for smart bill parsing and chatbot assistance  
- ⚡ **Real-time**: Live notifications and updates using Socket.IO
- 📱 **Responsive**: Beautiful UI that works perfectly on mobile and desktop
- 🧮 **Smart Calculations**: Three different bill splitting methods with automatic calculations
- 🏆 **Award Winning**: Developed for Naver AI Hackathon

## ✨ **Key Features**

### 🎨 **Beautiful User Experience**
- **Stunning Landing Page**: Animated hero section with rotating text and aurora background effects
- **Modern Design**: Clean, intuitive interface with Material-UI and Tailwind CSS
- **Responsive Layout**: Seamless experience across all devices

### 💰 **Advanced Bill Splitting**
- **3 Splitting Methods**:
  - **Equal Split**: Automatically divide bills equally among all participants
  - **By Person**: Manually specify exact amounts each person owes
  - **By Item**: Allocate specific items to different participants
- **Smart Calculations**: Real-time amount validation and distribution
- **OCR Integration**: Scan receipts with AI to auto-populate bill details
- **Payment Tracking**: Monitor who paid and who still owes money

### 👥 **Group Management**
- **Create & Manage Groups**: Organize expenses by friend groups, family, roommates
- **Member Permissions**: Admin controls and member role management
- **Group Statistics**: Track total expenses and individual contributions
- **Bill History**: Complete audit trail of all group expenses

### 🔔 **Real-time Notifications**
- **Live Updates**: Instant notifications for bill creation, updates, and payments
- **Multi-device Sync**: Notification state synchronized across all user devices
- **Email Notifications**: Backup email system for important updates

### 🤖 **AI Integration**
- **Clova Studio Chatbot**: Context-aware AI assistant for expense management help
- **Smart OCR**: Intelligent receipt scanning and data extraction
- **Expense Categorization**: AI-powered automatic expense category suggestions

## 🏗 **Project Structure**

```
splitly/
├── 📁 web/                    # Frontend - React + Vite + Material-UI
│   ├── 📁 src/
│   │   ├── 📁 components/     # Reusable React components
│   │   ├── 📁 pages/          # Page components and routing
│   │   ├── 📁 redux/          # Redux store and slices
│   │   └── 📁 utils/          # Frontend utilities
│   └── 📄 README.md           # Frontend documentation
├── 📁 api/                    # Backend - Express.js + MongoDB
│   ├── 📁 src/
│   │   ├── 📁 controllers/    # API route controllers
│   │   ├── 📁 models/         # MongoDB data models
│   │   ├── 📁 services/       # Business logic layer
│   │   └── 📁 sockets/        # Socket.IO event handlers
│   └── 📄 README.md           # Backend documentation
├── 📁 docs/                   # Project documentation
└── 📄 README.md               # This main project README
```

## 🛠 **Tech Stack**

**Frontend**: React 19.1.1, Vite, Material-UI, Redux Toolkit, Tailwind CSS, Framer Motion
**Backend**: Express.js 5.1.0, MongoDB 6.20, Socket.IO, JWT, Bcrypt
**External Services**: Clova Studio (AI), Brevo (Email), MongoDB Atlas

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18 or higher
- MongoDB 6.0 or higher
- npm or yarn package manager

### Installation

Install dependencies for both frontend and backend:

```bash
# Frontend
cd web
npm install

# Backend
cd api
npm install
```

### Environment Setup

**Backend** (api/.env):
```env
PORT=8017
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/splitly
DATABASE_NAME=splitly
ACCESS_JWT_SECRET_KEY=your-access-secret
REFRESH_JWT_SECRET_KEY=your-refresh-secret
WEBSITE_DOMAIN=http://localhost:5173
BREVO_API_KEY=your-brevo-api-key
GEMINI_API_KEY=your-google-ai-studio-api-key
GEMINI_MODEL=gemini-3-flash-preview
GEMINI_TIMEOUT_MS=60000
```

**Frontend** (web/.env):
```env
VITE_API_ROOT=http://localhost:8017
VITE_WEBSITE_DOMAIN=http://localhost:5173
```

### Running the Application

**Frontend** (http://localhost:5173):
```bash
cd web
npm run dev
```

**Backend** (http://localhost:8017):
```bash
cd api
npm run dev
```

## 🔌 **API Endpoints**

### Authentication
- `POST /api/v1/users/register` - User registration
- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/logout` - User logout

### Bills
- `POST /api/v1/bills` - Create new bill
- `GET /api/v1/bills/user/:userId` - Get user's bills
- `GET /api/v1/bills/:billId` - Get bill details
- `POST /api/v1/bills/scan` - OCR bill scanning

### Groups
- `POST /api/v1/groups` - Create group
- `GET /api/v1/groups` - Get all groups
- `GET /api/v1/groups/:groupId` - Get group details

### Notifications
- `GET /api/v1/notifications` - Get user notifications
- `PUT /api/v1/notifications/:id/read` - Mark as read

## 🚀 **Deployment**

### Development
```bash
# Backend
cd api && npm run dev

# Frontend (new terminal)
cd web && npm run dev
```

### Production
```bash
# Build frontend
cd web && npm run build

# Start backend
cd api && npm start
```

## 🏆 **Hackathon Achievement**

This project was developed for the **Naver AI Hackathon** showcasing:
- AI Integration with Naver's Clova Studio
- Vietnamese Market Focus
- Modern Technology Stack
- Real-world Application solving expense-sharing problems

## 📄 **Available Scripts**

See individual README files in `web/` and `api/` directories for detailed scripts and development guides.
