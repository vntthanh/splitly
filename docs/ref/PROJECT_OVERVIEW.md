# Spitly - Bill Sharing Application

## Project Overview

---

## Table of Contents

1. [Project Vision](#project-vision)
2. [Problem Statement](#problem-statement)
3. [Solution](#solution)
4. [Target Users](#target-users)
5. [Key Features](#key-features)
6. [Technical Architecture](#technical-architecture)
7. [Technology Stack](#technology-stack)
8. [Project Structure](#project-structure)
9. [Development Roadmap](#development-roadmap)
10. [Getting Started](#getting-started)

---

## Project Vision

**Spitly** is a modern, AI-powered bill-sharing application designed to make splitting expenses among friends, roommates, and groups as effortless as possible. Our vision is to eliminate the awkwardness and complexity of managing shared expenses while ensuring fairness and transparency.

### Mission Statement

To provide a simple, fair, and transparent platform for managing shared expenses, reducing financial friction in relationships and groups through smart automation and clear accountability.

---

## Problem Statement

### Current Challenges in Bill Sharing

1. **Manual Calculation Errors**

   - People struggle with mental math when splitting bills
   - Discounts, taxes, and tips complicate calculations
   - Item-based splitting is tedious to calculate manually

2. **Payment Tracking Difficulties**

   - Hard to remember who has paid and who hasn't
   - No central record of payment history
   - Following up on unpaid debts feels awkward

3. **Group Expense Complexity**

   - Multiple bills among the same group create complicated debt webs
   - Need to track "who owes whom" across many transactions
   - Settling up requires multiple transfers

4. **Fairness Concerns**

   - Same person often ends up paying repeatedly
   - No objective way to ensure fair rotation of payers
   - Difficult to track if payment burden is evenly distributed

5. **Lack of Accountability**
   - No audit trail of changes and payments
   - Disputes arise from missing records
   - Can't prove payment history

---

## Solution

### How Spitly Solves These Problems

1. **Automated Bill Splitting**

   - Two splitting methods: Equal split and item-based split
   - Automatic adjustment for discounts and taxes
   - Precise calculation eliminates disputes

2. **Centralized Payment Tracking**

   - Real-time payment status visibility
   - Automatic settlement detection
   - Payment history and audit trail

3. **Group-Wide Settlement**

   - Calculate net balances across all bills in a group
   - Minimize number of transactions needed
   - Clear payment instructions for final settlement

4. **AI-Powered Payer Selection** (Planned)

   - Fair rotation algorithm
   - Considers payment history and frequency
   - Suggests next payer objectively

5. **Comprehensive Activity Logging**
   - Every action is recorded
   - Transparent audit trail
   - Dispute resolution support

---

## Target Users

### Primary User Personas

#### 1. Young Professionals (25-35 years old)

- **Characteristics:** Share meals, coffee, and entertainment expenses with colleagues and friends
- **Pain Points:** Frequent small transactions, need quick splitting
- **Goals:** Quick bill creation, mobile access, payment tracking

#### 2. Roommates (20-30 years old)

- **Characteristics:** Share rent, utilities, groceries, and household expenses
- **Pain Points:** Recurring bills, multiple people, need long-term tracking
- **Goals:** Recurring bill support, fair payer rotation, settlement reports

#### 3. Travel Groups

- **Characteristics:** Friends traveling together sharing accommodation, food, and activities
- **Pain Points:** Many bills in short time, different currencies, need final settlement
- **Goals:** Quick entry, multi-currency support, easy settlement

#### 4. Social Groups & Clubs

- **Characteristics:** Regular groups with recurring expenses (sports teams, hobby clubs, study groups)
- **Pain Points:** Group management, member changes, long-term history
- **Goals:** Group dashboard, analytics, member management

---

## Key Features

### Core Features (MVP)

1. **User Management**

   - Email-based registration
   - Profile management
   - Auto-user creation from email

2. **Bill Management**

   - Equal split bills
   - Item-based split bills with tax/discount adjustment
   - Bill editing and deletion
   - Payment status tracking

3. **Group Management**

   - Create groups of frequent bill-sharing partners
   - Add/remove members
   - Associate bills with groups
   - Group dashboard

4. **Payment Tracking**

   - Mark payments as complete
   - View who has paid
   - Payment history
   - Opt-out functionality

5. **Activity Logging**
   - Comprehensive audit trail
   - Activity feed
   - Change history

### Advanced Features (Planned)

6. **Group Settlement**

   - Calculate net balances across multiple bills
   - Minimize transactions needed
   - Settlement reports and history

7. **AI Payer Selection**

   - Suggest next payer based on fairness algorithm
   - Payment rotation tracking
   - Balance distribution analytics

8. **Notifications**

   - Payment reminders
   - Bill update notifications
   - Email and push notification support

9. **Analytics**

   - Personal spending dashboard
   - Group statistics
   - Spending trends

10. **Advanced Features**
    - Multi-currency support
    - Recurring bills
    - Bill templates
    - Comments and discussions
    - Receipt attachments

---

## Technical Architecture

### Data Flow

1. **Bill Creation Flow**

   ```
   User Input → Validation → Calculate Splits → Create Bill Document
              → Create Activity Log → Notify Participants
   ```

2. **Payment Flow**

   ```
   Mark as Paid → Update Payment Status → Check Settlement
               → Create Activity Log → Notify Payer
   ```

3. **Settlement Flow**
   ```
   Select Bills → Calculate Net Balances → Minimize Transfers
               → Generate Settlement → Track Completion
   ```

---

## Technology Stack

### Backend

- **Runtime:** Node.js (v18+)
- **Database:** MongoDB (v6+)
  - Document-based NoSQL database
  - Flexible schema for different bill types
  - Excellent for embedded documents (items, payment status)

### Validation & Data Integrity

- **Joi:** Schema validation for all inputs
- **MongoDB Indexes:** Performance optimization

### Future Technologies

- **Redis:** Caching layer for performance
- **Socket.io:** Real-time updates
- **Bull/BullMQ:** Job queue for notifications and recurring bills
- **JWT:** Authentication tokens
- **SendGrid/Twilio:** Email and SMS notifications
- **Cloud Storage:** Receipt and attachment storage

---

## Project Structure

```
Naver-Final/
├── api/                          # Backend API
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   │   ├── mongodb.js       # MongoDB connection
│   │   │   ├── initDB.js        # Database initialization
│   │   │   └── environment.js   # Environment variables
│   │   │
│   │   ├── models/              # Data models
│   │   │   ├── userModel.js     # User model
│   │   │   ├── billModel.js     # Bill model
│   │   │   ├── groupModel.js    # Group model
│   │   │   └── activityModel.js # Activity model
│   │   │
│   │   ├── validations/         # Joi validation schemas
│   │   │   ├── userValidation.js
│   │   │   ├── billValidation.js
│   │   │   ├── groupValidation.js
│   │   │   └── activityValidation.js
│   │   │
│   │   ├── routes/              # API routes
│   │   │   ├── userRoutes.js
│   │   │   ├── billRoutes.js
│   │   │   ├── groupRoutes.js
│   │   │   └── activityRoutes.js
│   │   │
│   │   ├── controllers/         # Request handlers
│   │   ├── middleware/          # Express middleware
│   │   └── utils/               # Utility functions
│   │
│   ├── package.json
│   └── .env
│
├── client/                       # Frontend (Future)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   └── package.json
│
├── docs/                         # Documentation
│   ├── database.md              # Database schema documentation
│   ├── FEATURES.md              # Feature specifications
│   ├── USER_STORIES.md          # User stories
│   ├── DATABASE_DESIGN.md       # DB design recommendations
│   └── PROJECT_OVERVIEW.md      # This file
│
└── README.md
```

---

**Last Updated:** 2025-11-05

**Version:** 1.0.0-alpha

**Status:** Active Development