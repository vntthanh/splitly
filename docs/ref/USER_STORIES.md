# Spitly - User Stories

## User Personas

### Primary Personas

1. **The Organizer** - Person who frequently pays for group activities and needs to track reimbursements
2. **The Participant** - Person who joins group activities and needs to pay their share
3. **The Group Admin** - Person who manages a regular group (roommates, team, friends)

---

## Sumary of User Stories

### 1. User Management

- User registration and profile management

### 2. Bill Creation & Management

- Create bills with equal and item-based splits

### 3. Payment Tracking

- Mark payments as paid and view payment status

### 4. Group Management

- Create groups and associate bills

### 5. AI-Powered Features

- AI-based payer selection for fair distribution

### 6. Group Settlement

- Calculate and optimize group-wide settlements

### 7. Activity & Notifications

- View activity feed and receive notifications

### 8. Analytics & Reporting

- Personal spending dashboard

## Epic 1: User Management

### US-1.1: User Registration

**As a** new user
**I want to** create an account with my email
**So that** I can start tracking shared expenses

**Acceptance Criteria:**

- User can register with email, name, and optional phone number
- Email must be unique in the system
- User receives confirmation of successful registration
- User profile is created with default settings

**Priority:** High
**Effort:** 3 points

---

### US-1.2: User Profile Management

**As a** registered user
**I want to** update my profile information
**So that** my friends can easily identify me

**Acceptance Criteria:**

- User can update name, avatar, and phone number
- Changes are immediately reflected in the system
- All bills/groups show updated information
- Activity log records the profile update

**Priority:** Medium
**Effort:** 2 points

---

## Epic 2: Bill Creation & Management

### US-2.1: Create Equal Split Bill

**As an** organizer
**I want to** create a bill and split it equally among participants
**So that** everyone pays the same amount

**Acceptance Criteria:**

- Can specify bill name, description, and total amount
- Can add multiple participants by email
- System automatically creates users if they don't exist
- Total amount is divided equally among all participants
- Each participant can see their share amount
- Bill creator is marked as the payer by default

**Priority:** High
**Effort:** 5 points

---

### US-2.2: Create Item-Based Split Bill

**As an** organizer
**I want to** create a bill where different items are assigned to different people
**So that** each person only pays for what they consumed

**Acceptance Criteria:**

- Can add multiple items with names and amounts
- Can assign each item to one or more participants
- System calculates adjustment ratio for discounts/taxes
- Each participant sees only their allocated items
- Total amounts sum up correctly to the bill total
- Supports splitting single items among multiple people

**Priority:** High
**Effort:** 8 points

**Example:**

```
Bill: Restaurant - $198 total
Items:
  - Steak ($100) → John
  - Pasta ($50) → Mary
  - Wine ($50) → John, Mary (split)
Adjustment: 0.99 (for 10% discount + 10% tax)
```

---

### US-2.3: View Bill Details

**As a** participant
**I want to** view detailed information about a bill
**So that** I understand what I need to pay and why

**Acceptance Criteria:**

- Can see bill name, description, and total amount
- Can see who paid upfront
- Can see all participants and their amounts
- Can see payment status of each participant
- Can see item breakdown for item-based bills
- Can view bill creation and payment dates

**Priority:** High
**Effort:** 3 points

---

### US-2.4: Update Bill Information

**As a** bill creator
**I want to** update bill details after creation
**So that** I can correct mistakes or add missing information

**Acceptance Criteria:**

- Can update bill name and description
- Cannot change total amount if payments have been made
- Cannot change splitting method after creation
- Cannot remove participants who have already paid
- Activity log records all changes
- All participants are notified of changes

**Priority:** Medium
**Effort:** 5 points

---

### US-2.5: Delete Bill

**As a** bill creator
**I want to** delete a bill that was created by mistake
**So that** it doesn't clutter my bill list

**Acceptance Criteria:**

- Only bill creator can delete the bill
- Bill is soft-deleted (can be recovered)
- Cannot delete bills with confirmed payments (unless admin)
- All participants are notified of deletion
- Activity log records the deletion

**Priority:** Medium
**Effort:** 3 points

---

## Epic 3: Payment Management

### US-3.1: Mark Payment as Paid

**As a** participant
**I want to** mark my payment as completed
**So that** everyone knows I have paid my share

**Acceptance Criteria:**

- Can mark own payment as paid
- Payment date is automatically recorded
- Payer receives notification of payment
- Payment status is visible to all participants
- Bill is marked as "settled" when all participants have paid
- Activity log records the payment

**Priority:** High
**Effort:** 3 points

---

### US-3.2: View Payment Status

**As a** bill creator
**I want to** see who has paid and who hasn't
**So that** I can follow up with people who owe money

**Acceptance Criteria:**

- Can see list of all participants with payment status
- Can see payment dates for paid participants
- Can see total amount collected vs total amount owed
- Can filter bills by payment status (all paid, partially paid, unpaid)
- Can see historical payment trends

**Priority:** High
**Effort:** 3 points

---

### US-3.3: Opt Out from Bill

**As a** participant
**I want to** remove myself from a bill I was mistakenly added to
**So that** I don't have to pay for something I didn't participate in

**Acceptance Criteria:**

- Can opt out from any bill where I haven't paid yet
- Cannot opt out after payment is marked as paid
- Total amount is recalculated among remaining participants
- Bill creator is notified of opt-out
- Activity log records the opt-out
- Can provide optional reason for opting out

**Priority:** Medium
**Effort:** 5 points

---

### US-3.4: Send Payment Reminder

**As a** payer/bill creator
**I want to** send reminders to people who haven't paid
**So that** I can get reimbursed faster

**Acceptance Criteria:**

- Can send reminder via email, notification, or SMS
- Can send to individual participants or all unpaid participants
- Reminder includes bill details and amount owed
- Activity log records reminder being sent
- Can see history of reminders sent
- Cannot spam (rate limiting on reminders)

**Priority:** Medium
**Effort:** 5 points

---

## Epic 4: Group Management

### US-4.1: Create Group

**As a** user
**I want to** create a group of people I frequently share bills with
**So that** I don't have to add them individually each time

**Acceptance Criteria:**

- Can create group with name and description
- Can add multiple members by email
- Can set group avatar
- System automatically creates users if they don't exist
- Activity log records group creation
- Group creator becomes group admin

**Priority:** High
**Effort:** 5 points

---

### US-4.2: Add/Remove Group Members

**As a** group admin
**I want to** add or remove members from the group
**So that** the group membership stays up to date

**Acceptance Criteria:**

- Only group admin can add/remove members
- Can add members by email
- Cannot remove members who have unpaid bills in the group
- Removed members can still see their bills
- Activity log records member changes
- Members are notified when added/removed

**Priority:** Medium
**Effort:** 3 points

---

### US-4.3: Associate Bills with Groups

**As a** group admin
**I want to** link bills to my group
**So that** all group expenses are organized together

**Acceptance Criteria:**

- Can add existing bills to group
- Can create new bills directly within group
- Group participants are auto-populated when creating group bills
- Can view all bills associated with a group
- Can filter bills by group
- Activity log records bill-group associations

**Priority:** High
**Effort:** 3 points

---

### US-4.4: View Group Dashboard

**As a** group member
**I want to** see an overview of all group activities
**So that** I can stay informed about group expenses

**Acceptance Criteria:**

- Can see total group spending
- Can see list of all group bills
- Can see who owes money in the group
- Can see recent group activities
- Can see group members list
- Can see group statistics (most frequent payer, etc.)

**Priority:** Medium
**Effort:** 5 points

---

## Epic 5: AI-Powered Features (Future)

### US-5.1: AI Payer Selection

**As a** group member
**I want the system to** suggest who should pay for the next bill
**So that** payment responsibility is fairly distributed

**Acceptance Criteria:**

- AI analyzes payment history within the group
- Considers frequency of payments by each member
- Considers total amounts paid by each member
- Suggests the most fair payer
- Shows reasoning for the suggestion
- Can override the suggestion manually
- Tracks suggestion accuracy over time

**Priority:** Low
**Effort:** 13 points

---

## Epic 6: Group Settlement

### US-6.1: Calculate Group-Wide Settlement

**As a** group member
**I want to** see the final settlement for all bills in the group
**So that** I can pay all my debts at once instead of per bill

**Acceptance Criteria:**

- System calculates net balance for each group member
- Shows who owes whom and how much
- Minimizes number of transactions needed
- Provides clear payment instructions
- Can generate settlement report
- Can mark settlements as completed
- Supports partial settlements

**Priority:** High
**Effort:** 8 points

**Example:**

```
Group Settlement Summary:
  John paid: $500, owes: $200 → Net: +$300 (receives)
  Mary paid: $100, owes: $300 → Net: -$200 (pays)
  Bob paid: $200, owes: $300 → Net: -$100 (pays)

Optimal Transfers:
  Mary → John: $200
  Bob → John: $100
```

---

### US-6.2: Export Settlement Report

**As a** group admin
**I want to** export a settlement report
**So that** I can share it with group members and keep records

**Acceptance Criteria:**

- Can export to PDF, CSV, or Excel
- Report includes all bills in the period
- Shows individual amounts and net balances
- Shows suggested payment transfers
- Includes timestamps and bill references
- Can customize report date range
- Can filter by group or all bills

**Priority:** Medium
**Effort:** 5 points

---

## Epic 7: Activity & Notifications

### US-7.1: View Activity Feed

**As a** user
**I want to** see a feed of all activities related to my bills
**So that** I stay informed about changes and payments

**Acceptance Criteria:**

- Shows chronological list of activities
- Includes bill creation, updates, payments, and reminders
- Can filter by activity type
- Can filter by date range
- Shows who performed each activity
- Includes relevant details for each activity

**Priority:** Medium
**Effort:** 3 points

---

### US-7.2: Receive Notifications

**As a** user
**I want to** receive notifications for important events
**So that** I don't miss payment deadlines or updates

**Acceptance Criteria:**

- Notified when added to a bill
- Notified when bill details change
- Notified when payment reminder is sent
- Notified when someone pays
- Can customize notification preferences
- Supports email and in-app notifications

**Priority:** Medium
**Effort:** 8 points

---

## Epic 8: Analytics & Reporting

### US-8.1: Personal Spending Dashboard

**As a** user
**I want to** see my spending analytics
**So that** I can understand my expense patterns

**Acceptance Criteria:**

- Shows total amount spent over time
- Shows total amount owed to me
- Shows total amount I owe others
- Shows spending by category/group
- Shows monthly trends
- Can export data for personal records

**Priority:** Low
**Effort:** 8 points

---

## Epic 9: AI OCR Bill Scanning (Naver CLOVA)

### US-9.1: Scan Receipt with Camera

**As a** user
**I want to** scan a physical receipt with my camera
**So that** I don't have to manually enter all the bill details

**Acceptance Criteria:**

- Can capture receipt image using device camera
- Can upload existing photo from gallery
- Image quality validation before upload
- Support for multiple image formats (JPG, PNG, PDF)
- Can rotate/crop image before processing
- Loading indicator shows processing status
- Fallback to manual entry if OCR fails

**Priority:** High
**Effort:** 8 points

---

### US-9.2: Auto-Extract Bill Data from Receipt

**As a** user
**I want the system to** automatically extract bill information from my receipt
**So that** I can quickly create bills without typing

**Acceptance Criteria:**

- System uses Naver CLOVA OCR to extract:
  - Merchant/restaurant name
  - Total amount
  - Individual items with prices
  - Tax and tip amounts
  - Date and time
  - Receipt number
- Extracted data displayed for review
- Confidence scores shown for each field
- Low-confidence fields highlighted for review
- Can manually edit any extracted field
- Original receipt image attached to bill

**Priority:** High
**Effort:** 13 points

**Example:**

```
Receipt Image → Naver CLOVA OCR →
{
  merchantName: "Starbucks Coffee" (confidence: 0.98),
  totalAmount: 45000 (confidence: 0.95),
  items: [
    { name: "Americano", price: 15000 },
    { name: "Latte", price: 18000 },
    { name: "Cake", price: 12000 }
  ],
  tax: 4500 (confidence: 0.92)
}
```

---

### US-9.3: Review and Correct OCR Results

**As a** user
**I want to** review and correct OCR extraction results
**So that** I can ensure bill accuracy before creating it

**Acceptance Criteria:**

- Can review all extracted fields
- Can edit any field value
- Original receipt image displayed alongside data
- Can zoom into receipt image
- Corrections tracked in system
- Can add missing items manually
- Can delete incorrectly detected items
- One-click to create bill from corrected data
- OCR accuracy feedback recorded

**Priority:** High
**Effort:** 5 points

---

### US-9.4: Handle OCR Errors

**As a** user
**I want the system to** handle OCR failures gracefully
**So that** I can still create bills even if OCR doesn't work

**Acceptance Criteria:**

- Clear error messages for OCR failures
- Option to retry OCR processing
- Fallback to manual bill entry
- Receipt image still saved even if OCR fails
- Can request OCR reprocessing later
- Admin notification for repeated OCR failures
- Error reasons logged for improvement

**Priority:** Medium
**Effort:** 3 points

---

## Epic 10: Guest User Management

### US-10.1: Add Guest to Bill

**As a** bill creator
**I want to** add guests who don't have accounts to my bill
**So that** I can include one-time participants without requiring them to register

**Acceptance Criteria:**

- Can add participant by email as guest
- Guest account automatically created (minimal info)
- Guest marked differently from regular members
- Guest receives email notification about bill
- Guest can view bill without logging in (magic link)
- Guest participation tracked separately
- Can convert guest to full member later

**Priority:** High
**Effort:** 8 points

---

### US-10.2: Send Event Summary to Guests

**As a** bill creator
**I want to** automatically send event summaries to guests after the event
**So that** guests know what they owe without needing to use the app

**Acceptance Criteria:**

- Summary email sent after event date
- Email includes:
  - Event name and date
  - Total amount owed by guest
  - Payment instructions
  - List of items (if item-based split)
  - Payment deadline
  - Link to view full details
- PDF attachment of summary
- Can manually trigger summary email
- Summary delivery tracked

**Priority:** High
**Effort:** 5 points

**Example Email:**

```
Subject: Bill Summary - John's Birthday Party

Hi Sarah,

Thank you for joining us at John's Birthday Party on Nov 5, 2024.

Your share: $45.00

Items:
- Dinner: $30.00
- Drinks: $15.00

Please pay to: John (john@example.com)
Payment methods: Bank transfer, Venmo

[View Full Details] [Pay Now]
```

---

### US-10.3: Manage Guest Lifecycle

**As a** system administrator
**I want** guest accounts to automatically expire after events
**So that** the database doesn't accumulate inactive guest accounts

**Acceptance Criteria:**

- Guest accounts expire 30 days after event date
- Warning email sent 7 days before expiry
- Option for guest to convert to full member
- Expired guests can no longer access bills
- Historical data preserved (soft delete)
- Can extend guest expiry manually
- Automatic cleanup job runs daily

**Priority:** Medium
**Effort:** 5 points

---

### US-10.4: Guest Payment Confirmation

**As a** guest user
**I want to** confirm my payment via email link
**So that** I can mark my payment without creating an account

**Acceptance Criteria:**

- Guest receives magic link in email
- Can mark payment as paid via link
- No login required
- Can upload payment proof
- Confirmation sent to bill creator
- Activity logged
- Link expires after 7 days
- Can request new link

**Priority:** Medium
**Effort:** 5 points

---

## Epic 11: Group Fund Management

### US-11.1: Create Group Fund

**As a** group admin
**I want to** create a shared fund for the group
**So that** we have money available for group expenses

**Acceptance Criteria:**

- Can enable group fund for any group
- Can set fund name and description
- Can configure fund settings:
  - Minimum balance
  - Target balance (savings goal)
  - Contribution rules (voluntary/mandatory)
  - Withdrawal approval method (admin/voting)
  - Auto-refund on leaving
- Fund balance starts at 0
- All members notified of fund creation
- Fund dashboard shows current balance

**Priority:** High
**Effort:** 8 points

---

### US-11.2: Contribute to Group Fund

**As a** group member
**I want to** contribute money to the group fund
**So that** the group has money for shared expenses

**Acceptance Criteria:**

- Can contribute any amount (min $1)
- Can add contribution description
- Can upload payment proof
- Contribution immediately reflected in balance
- All members notified of contribution
- Contribution tracked per member
- Can view my total contributions
- Can set up recurring contributions (future)

**Priority:** High
**Effort:** 5 points

---

### US-11.3: Withdraw from Group Fund

**As a** group member
**I want to** request withdrawal from group fund
**So that** we can use fund money for group expenses

**Acceptance Criteria:**

- Can request withdrawal with amount and reason
- Must specify withdrawal category:
  - Emergency expense
  - Group event
  - Advance payment
  - Shared expense
  - Charity/donation
  - Member assistance
  - Savings goal
- Can attach supporting documents
- Withdrawal request triggers approval workflow
- Admin/voters notified of request
- Cannot withdraw more than current balance
- Withdrawal history tracked

**Priority:** High
**Effort:** 8 points

**Special Cases:**

1. Emergency expenses - Fast-track approval
2. Group events - Birthday parties, farewells
3. Advance payments - Deposits, reservations
4. Shared expenses - Coffee, supplies
5. Charity - Group donations
6. Member assistance - Help members in need
7. Savings goals - Trips, equipment

---

### US-11.4: Approve/Reject Fund Withdrawal

**As a** group admin or member (with voting rights)
**I want to** approve or reject withdrawal requests
**So that** fund money is used appropriately

**Acceptance Criteria:**

- Receive notification of withdrawal request
- Can view request details and reason
- Can approve or reject with comment
- For voting system:
  - All members can vote
  - Need threshold % to approve (e.g., 66%)
  - Voting deadline (e.g., 48 hours)
  - Auto-reject if deadline passes without quorum
- For admin approval:
  - Only admin can approve
  - Instant approval/rejection
- Requester notified of decision
- Approved withdrawal updates balance
- Rejection reason required

**Priority:** High
**Effort:** 8 points

---

### US-11.5: View Group Fund Dashboard

**As a** group member
**I want to** view the group fund dashboard
**So that** I can see fund status and transaction history

**Acceptance Criteria:**

- Shows current balance prominently
- Shows progress to target balance (if set)
- Lists all transactions (contributions & withdrawals)
- Shows per-member contribution totals
- Charts showing fund usage by category
- Pending withdrawal requests
- Downloadable transaction history
- Can filter by date range and transaction type
- Can search transactions

**Priority:** Medium
**Effort:** 8 points

---

### US-11.6: Refund on Leaving Group

**As a** group member leaving the group
**I want to** receive my fund contributions back
**So that** I don't lose money I contributed

**Acceptance Criteria:**

- System calculates net contribution (contributed - withdrawn)
- If auto-refund enabled and balance available:
  - Refund automatically processed
  - Refund amount = net contribution
  - Cannot exceed current fund balance
- If insufficient balance:
  - Partial refund or deferred
  - Admin notified
- Refund transaction recorded
- Leaving member notified
- Can waive refund (donate to fund)

**Priority:** Medium
**Effort:** 5 points

---

## Epic 12: Mobile & Convenience Features

### US-12.1: Quick Bill Creation

**As a** frequent user
**I want to** quickly create bills from templates
**So that** I can save time on recurring expenses

**Acceptance Criteria:**

- Can save bill configurations as templates
- Can create new bill from template with one click
- Template includes participants, splitting method, and items
- Can share templates with groups
- Can edit template details before creation

**Priority:** Low
**Effort:** 5 points

---
