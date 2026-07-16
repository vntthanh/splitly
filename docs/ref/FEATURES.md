# Spitly - Bill Sharing Application Features

## Core Features

### 1. User Management
- **User Registration & Authentication**
  - Email-based user accounts
  - Auto-user creation when adding participants via email
  - User profile management (name, avatar, phone)
  - Activity tracking (login/logout logs)

- **Guest User Support**
  - Add guests to bills without requiring full registration
  - Guests receive email summary after event/party
  - Guest participation tracked separately from members
  - One-time or temporary participation
  - Automatic cleanup of inactive guest accounts

### 2. Bill Creation & Management
- **AI-Powered Bill Scanning (OCR)**
  - Scan physical receipts with camera
  - Automatic data extraction using OCR:
    - Merchant/restaurant name
    - Total amount
    - Individual items and prices
    - Tax and tip amounts
    - Date and time
  - Manual correction of OCR results
  - Support for multiple receipt formats
  - Image storage for reference
  - Multi-language receipt support

- **Flexible Bill Splitting Methods**
  - **Equal Split**: Divide total amount equally among all participants
  - **Item-based Split**: Assign specific items to specific people
    - Supports discount/tax adjustment with automatic ratio calculation
    - Multiple people can share a single item

- **Bill Information**
  - Bill name and description
  - Total amount tracking
  - Payment date recording
  - Designated payer (person who paid upfront)
  - Multiple participants support
  - Receipt image attachment

- **Bill Operations**
  - Create new bills with participants
  - Create bills from scanned receipts (OCR)
  - Update bill details
  - Soft delete bills (recoverable)
  - View bill history and details

### 3. Payment Tracking
- **Payment Status Management**
  - Track who owes how much
  - Mark individual payments as paid
  - Record payment dates
  - Overall settlement status tracking

- **Payment Features**
  - Individual payment confirmation
  - Automatic settlement detection (all participants paid)
  - Opt-out functionality (remove yourself from a bill)
  - Payment reminders (email/notification/SMS)

### 4. Group Management
- **Group Features**
  - Create groups of frequent bill-sharing partners
  - Add/remove group members
  - Group avatars and descriptions
  - Associate bills with groups

- **Group Operations**
  - View all bills within a group
  - Track group member activities
  - Group-based bill organization
  - Quick participant selection from groups

- **Group Fund/Wallet**
  - Shared pool of money contributed by group members
  - Members can donate/contribute to group fund
  - Track individual contributions and balance
  - Use fund for special cases:
    - **Emergency expenses**: Unexpected group costs
    - **Group events**: Birthdays, celebrations, farewell parties
    - **Advance payments**: Book venues, deposits, reservations
    - **Small shared expenses**: Coffee runs, snacks, supplies
    - **Charity/donations**: Group charitable activities
    - **Member assistance**: Help members in financial difficulty
    - **Group savings goals**: Save for trips, equipment, activities
  - Withdrawal approval system (admin or voting)
  - Transaction history and transparency
  - Fund balance notifications
  - Automatic refund when leaving group (optional)

### 5. Activity & Audit Logging
- **Comprehensive Activity Tracking**
  - All user actions logged
  - Bill lifecycle tracking (created, updated, paid, settled)
  - Group member changes
  - Payment status changes

- **Activity Types**
  - User activities: registration, login, logout, profile updates
  - Bill activities: creation, updates, payments, settlements, reminders
  - Group activities: creation, member changes, bill associations

### 6. Analytics & Reporting
- **User Spending Analysis**
  - Total amount spent over time
  - Total amount owed to others
  - Total amount others owe to you

- **Group Analytics**
  - Group spending patterns
  - Most frequent payers
  - Settlement statistics

### 7. Notifications & Reminders
- **Payment Reminders**
  - Send reminders to users who haven't paid
  - Multiple reminder channels (email, notification, SMS)
  - Reminder history tracking

- **Activity Notifications**
  - Bill creation notifications
  - Payment received notifications
  - Group activity updates

### 8. AI-Powered Payer Selection
- **Smart Payer Recommendation**
  - AI algorithm to suggest who should pay next based on:
    - Payment history in the group
    - Previous payer rotation
    - Balance fairness (who has paid less frequently)
    - Total amounts paid by each member

- **Fairness Tracking**
  - Track payment rotation within groups
  - Suggest payer to maintain balance
  - Prevent same person from always paying

### 9. Group-Wide Settlement Calculation
- **Multi-Bill Settlement**
  - Calculate net balances across all bills in a group
  - Determine optimal payment transfers
  - Minimize number of transactions needed
  - Show final amounts each person owes/receives

- **Settlement Report**
  - Clear visualization of who pays whom
  - One-time settlement suggestions
  - Export settlement summary

### 10. Advanced Bill Features
- **Recurring Bills**
  - Set up recurring expenses (monthly rent, utilities)
  - Automatic bill creation on schedule
  - Template-based bill creation

- **Bill Templates**
  - Save frequently used bill configurations
  - Quick bill creation from templates
  - Shared templates within groups

### 11. Export & Reporting
- **Data Export**
  - Export bills to CSV/Excel
  - Generate PDF receipts
  - Export settlement reports

- **Financial Reports**
  - Monthly spending summaries
  - Group expense reports
  - Tax-ready reports

### 12. Social Features
- **Comments & Notes**
  - Add comments to bills
  - @ mention participants
  - Photo attachments (receipts)

- **Social Proof**
  - Bill confirmation by multiple parties
  - Dispute resolution workflow

### 14. Mobile Integration
- **Mobile App Features**
  - Push notifications
  - QR code bill sharing
  - Quick payment confirmation
  - Photo receipt upload