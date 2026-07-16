# Spitly Database Schema Documentation
### 1. Users Collection

**Collection Name:** `users`

**Purpose:** Store user account information

**Schema:**
```javascript
{
  _id: ObjectId,
  email: String (required, unique, lowercase),
  name: String (required, 2-100 characters),
  avatar: String (URL, optional),
  phone: String (10-11 digits, optional),
  bankName: String (optional), //code
  bankAccount: String (optional),
  password: String (hashed, required),
  isVerified: Boolean (email verified),
  userType: String (enum: 'member', 'guest', default: 'member'),
  isGuest: Boolean (default: false),
  lastActivityDate: Timestamp,
  verifyToken: String (for email verification),
  createdAt: Timestamp,
  updatedAt: Timestamp,
  _destroy: Boolean (soft delete)
}
```

**Indexes:**
- `email`: Unique index for fast user lookup
- `createdAt`: Descending index for sorting

**Example:**
```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "phihung@example.com",
  "name": "Phi Hùng",
  "avatar": "https://example.com/avatar.jpg",
  "phone": "0123456789",
  "password": "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Z3f6t7a5e5OeF5r5q6u5e", 
  "isVerified": true,
  "userType": "member",
  "isGuest": false,
  "lastActivityDate": 1699000000000,
  "verifyToken": "abc123",
  "createdAt": 1699000000000,
  "updatedAt": null,
  "_destroy": false
}
```

---

### 2. Bills Collection

**Collection Name:** `bills`

**Purpose:** Store bill/invoice information and track payments

**Schema:**
```javascript
{
  _id: ObjectId,
  billName: String (required, 1-200 characters),
  description: String (optional, max 500 characters),
  creatorId: String (required, user ObjectId),
  payerId: String (required, user ObjectId - person who paid upfront),
  totalAmount: Number (required, >= 0),
  paymentDate: Timestamp,
  creationDate: Timestamp,
  paymentDeadline: Timestamp,
  splittingMethod: String (enum: 'equal' | 'item-based'),
  participants: [String] (array of user ObjectIds),
  items: [
    {
      name: String (required),
      amount: Number (required),
      quantity: Number (optional, default 1),
      allocatedTo: [String] (array of user ObjectIds)
    }
  ],
  paymentStatus: [
    {
      userId: String (user ObjectId),
      amountOwed: Number,
      isPaid: Boolean,
      paidDate: Timestamp
    }
  ],
  isSettled: Boolean (all participants paid),
  optedOutUsers: [String] (array of user ObjectIds),
  createdAt: Timestamp,
  updatedAt: Timestamp,
  _destroy: Boolean
}
```

**Indexes:**
- `creatorId`: Index for bills created by user
- `payerId`: Index for bills paid by user
- `participants`: Index for bills user is part of
- `isSettled`: Index for filtering settled/unsettled bills
- `createdAt`: Descending index for sorting
- `paymentDate`: Descending index for sorting

**Note:** When creating bills with emails, the system will automatically find or create users by email. If a user doesn't exist, it will be created with the name extracted from the email (characters before '@').

**Example (Equal Split):**
```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "billName": "Cơm hến O Mân",
  "description": "Ăn trưa với nhóm",
  "creatorId": "507f1f77bcf86cd799439011",
  "payerId": "507f1f77bcf86cd799439011",
  "totalAmount": 350000,
  "paymentDate": 1699000000000,
  "splittingMethod": "equal",
  "participants": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439015",
    "507f1f77bcf86cd799439016",
    "507f1f77bcf86cd799439017"
  ],
  "items": [],
  "paymentStatus": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "amountOwed": 87500,
      "isPaid": true,
      "paidDate": 1699000000000
    },
    {
      "userId": "507f1f77bcf86cd799439015",
      "amountOwed": 87500,
      "isPaid": false,
      "paidDate": null
    },
    {
      "userId": "507f1f77bcf86cd799439016",
      "amountOwed": 87500,
      "isPaid": false,
      "paidDate": null
    },
    {
      "userId": "507f1f77bcf86cd799439017",
      "amountOwed": 87500,
      "isPaid": false,
      "paidDate": null
    }
  ],
  "isSettled": false,
  "optedOutUsers": [],
  "createdAt": 1699000000000,
  "updatedAt": null,
  "_destroy": false
}
```

**Example (Item-based Split with Discount/Tax):**
```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439013"),
  "billName": "Mua đồ chung",
  "description": "Có giảm giá 10% và thuế VAT",
  "creatorId": "507f1f77bcf86cd799439011",
  "payerId": "507f1f77bcf86cd799439011",
  "totalAmount": 198000, // Actual bill total (after 10% discount + 10% VAT)
  "paymentDate": 1699000000000,
  "splittingMethod": "item-based",
  "participants": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439015",
    "507f1f77bcf86cd799439016"
  ],
  "items": [
    {
      "name": "Bánh mì",
      "amount": 50000, // Original price before discount/tax
      "allocatedTo": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439015"]
    },
    {
      "name": "Cà phê",
      "amount": 150000, // Original price before discount/tax
      "allocatedTo": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439015", "507f1f77bcf86cd799439016"]
    }
  ],
  // Calculation:
  // A = 50000 + 150000 = 200000 (sum of item amounts)
  // B = 198000 (actual total)
  // C = 198000 / 200000 = 0.99 (adjustment ratio)
  // Bánh mì adjusted: 50000 × 0.99 = 49500
  // Cà phê adjusted: 150000 × 0.99 = 148500
  "paymentStatus": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "amountOwed": 74250, // (49500/2) + (148500/3) = 24750 + 49500
      "isPaid": true,
      "paidDate": 1699000000000
    },
    {
      "userId": "507f1f77bcf86cd799439015",
      "amountOwed": 74250, // (49500/2) + (148500/3) = 24750 + 49500
      "isPaid": false,
      "paidDate": null
    },
    {
      "userId": "507f1f77bcf86cd799439016",
      "amountOwed": 49500, // (148500/3) = 49500 (cà phê only)
      "isPaid": false,
      "paidDate": null
    }
  ],
  "isSettled": false,
  "optedOutUsers": [],
  "createdAt": 1699000000000,
  "updatedAt": null,
  "_destroy": false
}
```

---

### 3. Groups Collection

**Collection Name:** `groups`

**Purpose:** Manage user groups for easier bill sharing

**Schema:**
```javascript
{
  _id: ObjectId,
  groupName: String (required, 1-100 characters),
  description: String (optional, max 500 characters),
  creatorId: String (required, user ObjectId),
  members: [String] (array of user ObjectIds, min 1),
  bills: [String] (array of bill ObjectIds),
  avatar: String (URL, optional),
  createdAt: Timestamp,
  updatedAt: Timestamp,
  _destroy: Boolean
}
```

**Indexes:**
- `creatorId`: Index for groups created by user
- `members`: Index for groups user belongs to
- `createdAt`: Descending index for sorting

**Note:** When creating groups with emails, the system will automatically find or create users by email. If a user doesn't exist, it will be created with the name extracted from the email (characters before '@').

**Example:**
```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439014"),
  "groupName": "BỆT",
  "description": "Bully everyone together",
  "creatorId": "507f1f77bcf86cd799439015",
  "members": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439015",
    "507f1f77bcf86cd799439016",
    "507f1f77bcf86cd799439017"
  ],
  "bills": [
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013"
  ],
  "avatar": null,
  "createdAt": 1699000000000,
  "updatedAt": null,
  "_destroy": false
}
```

---

### 4. Activities Collection

**Collection Name:** `activities`

**Purpose:** Track user activities and events in the application (audit log)

**Schema:**
```javascript
{
  _id: ObjectId,
  activityType: String (enum - see ACTIVITY_TYPES),
  userId: String (user ObjectId who performed the activity),
  resourceType: String (enum: 'bill', 'group', 'user'),
  resourceId: String (ObjectId of the resource),
  details: {
    // Bill activity details
    billName: String (optional),
    amount: Number (optional),
    paymentStatus: String (optional),
    
    // Group activity details
    groupName: String (optional),
    memberEmail: String (optional),
    memberId: String (optional),
    
    // User activity details
    userEmail: String (optional),
    userName: String (optional),
    
    // Reminder details
    reminderType: String (optional: 'email', 'notification', 'sms'),
    recipientId: String (optional),
    
    // Update tracking
    previousValue: Object (optional),
    newValue: Object (optional),
    
    // Additional metadata
    ipAddress: String (optional),
    userAgent: String (optional),
    description: String (optional, max 500 characters)
  },
  createdAt: Timestamp,
  _destroy: Boolean
}
```

**Activity Types:**
- **Bill Activities:** `bill_created`, `bill_updated`, `bill_deleted`, `bill_paid`, `bill_settled`, `bill_reminder_sent`, `bill_user_opted_out`
- **Group Activities:** `group_created`, `group_updated`, `group_deleted`, `group_member_added`, `group_member_removed`, `group_bill_added`
- **User Activities:** `user_created`, `user_updated`, `user_login`, `user_logout`

**Indexes:**
- `userId`: Index for activities by user
- `resourceType + resourceId`: Compound index for activities by resource
- `activityType`: Index for activities by type
- `createdAt`: Descending index for chronological sorting
- `userId + createdAt`: Compound index for user activity timeline

**Example:**
```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439018"),
  "activityType": "bill_created",
  "userId": "507f1f77bcf86cd799439011",
  "resourceType": "bill",
  "resourceId": "507f1f77bcf86cd799439012",
  "details": {
    "billName": "Cơm hến O Mân",
    "amount": 350000,
    "description": "Created new bill: Cơm hến O Mân"
  },
  "createdAt": 1699000000000,
  "_destroy": false
}
```

---

## Model Functions

### User Model (`userModel.js`)

- `createNew(data, options)` - Create a new user (with optional activity logging)
- `findOneById(userId)` - Find user by ID
- `findOneByEmail(email)` - Find user by email
- `getAll()` - Get all users
- `update(userId, updateData, options)` - Update user information (with optional activity logging)
- `deleteOneById(userId)` - Delete user
- `findOrCreateUserByEmail(email, options)` - Find user by email, or create if not exists (with optional activity logging)
- `logLogin(userId, loginDetails)` - Log user login activity
- `logLogout(userId, logoutDetails)` - Log user logout activity

### Bill Model (`billModel.js`)

- `createNew(data, options)` - Create a new bill with automatic activity logging
- `findOneById(billId)` - Find bill by ID
- `getAll()` - Get all bills
- `getBillsByUser(userId)` - Get all bills for a user (by user ID)
- `getBillsByCreator(creatorId)` - Get bills created by user (by user ID)
- `getBillsByUserWithPagination(userId, page, limit)` - Get bills for a user with pagination support
  - `userId` (String): User ID to get bills for
  - `page` (Number, default: 1): Page number (starts from 1)
  - `limit` (Number, default: 10): Number of bills per page
  - Returns: `{ bills: Array, pagination: { currentPage, totalPages, totalBills, limit, hasNextPage, hasPrevPage } }`
  - Example: Page 1 with limit 10 returns bills 0-9, Page 2 returns bills 10-19
- `searchBillsByUserWithPagination(userId, customQuery, page, limit)` - Search bills for a user with custom query filters and pagination
  - `userId` (String): User ID to search bills for
  - `customQuery` (Object): Custom MongoDB query filters (built by billService with full text search logic)
  - `page` (Number, default: 1): Page number (starts from 1)
  - `limit` (Number, default: 10): Number of bills per page
  - Returns: `{ bills: Array, pagination: { page, limit, total, totalPages } }`
  - Note: Full text search logic (billName, description, paymentDate, year, month) is implemented in billService.js
- `getAllWithPagination(page, limit)` - Get all bills with pagination support
  - `page` (Number, default: 1): Page number (starts from 1)
  - `limit` (Number, default: 10): Number of bills per page
  - Returns: `{ bills: Array, pagination: { currentPage, totalPages, totalBills, limit, hasNextPage, hasPrevPage } }`
- `update(billId, updateData, options)` - Update bill information (with optional activity logging)
- `markAsPaid(billId, userId, options)` - Mark a user's payment as paid (with activity logging)
- `optOutUser(billId, userId, options)` - Remove user from bill (with activity logging)
- `deleteOneById(billId, options)` - Delete bill (with optional activity logging)
- `sendReminder(billId, reminderType, recipientUserId, sentByUserId)` - Send bill reminder with activity logging

### Group Model (`groupModel.js`)

- `createNew(data, options)` - Create a new group (with automatic activity logging)
- `findOneById(groupId)` - Find group by ID
- `getAll()` - Get all groups
- `getGroupsByUser(userId)` - Get groups user belongs to (by user ID)
- `update(groupId, updateData, options)` - Update group information (with optional activity logging)
- `addMember(groupId, memberId, options)` - Add member to group (with activity logging)
- `removeMember(groupId, memberId, options)` - Remove member from group (with activity logging)
- `addBill(groupId, billId, options)` - Add bill to group (with activity logging)
- `deleteOneById(groupId, options)` - Delete group (with optional activity logging)

### Activity Model (`activityModel.js`)

- `createNew(data)` - Create a new activity record
- `findOneById(activityId)` - Find activity by ID
- `getAll(limit, offset)` - Get all activities with pagination
- `getActivitiesByUser(userId, limit, offset)` - Get activities by user ID
- `getActivitiesByResource(resourceType, resourceId, limit)` - Get activities by resource (bill/group/user)
- `getActivitiesByType(activityType, limit, offset)` - Get activities by type
- `getActivitiesByDateRange(startDate, endDate, limit)` - Get activities within date range
- `update(activityId, updateData)` - Update activity (limited fields)
- `deleteOneById(activityId)` - Soft delete activity
- `logBillActivity(activityType, userId, billId, details)` - Helper to log bill activities
- `logGroupActivity(activityType, userId, groupId, details)` - Helper to log group activities
- `logUserActivity(activityType, userId, targetUserId, details)` - Helper to log user activities
