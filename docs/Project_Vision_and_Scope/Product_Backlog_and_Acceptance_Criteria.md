# Splitly — Product Backlog and Acceptance Criteria

## 1. Purpose

This document turns the pre-Splitly As-Is analysis and the proposed target workflow into development-ready, testable requirements. It is a prospective baseline for a new build; it does not claim that repository features are complete.

The document defines the baseline for planning, implementation, prototype review, and testing.

### 1.1 Scope and release boundary

| Scope | Decision |
| --- | --- |
| **MVP core increment** | Authentication, groups/members, manual bill entry, one payer and selected participants, equal/by-person/by-item splitting, validation, bill detail/history, cross-bill debt clearing, VietQR assistance, payment declaration/confirmation, creditor reminders, and essential notifications. |
| **MVP Gemini increment** | JPG/JPEG, PNG, or WebP receipt upload up to 10 MB; Gemini 2.5 Flash extraction; editable draft review/correction; and manual fallback. The user still chooses payer, participants, and allocation method. |
| **Post-MVP backlog** | PDF receipt input, TingTing chatbot, advanced reports, AI payer recommendation, multiple payers, automatic bank verification, wallet/payment gateway, recurring bills, exports, multi-currency, and a separate broker/microservice messaging platform. The MongoDB outbox and notification worker remain part of the MVP architecture. |

### 1.2 Business rules used by all bill stories

1. A bill has one designated payer (`payerId`), at least one participant, a positive total, creation date, payment deadline, and one split method.
2. Supported split methods are `equal`, `people-based` (shown as **By person**), and `item-based` (shown as **By item**).
3. The financial invariant is mandatory: after the selected allocation and deterministic rounding, the sum of all `amountOwed` values must equal `totalAmount` exactly. The system must show the difference and block saving when it is not zero.
4. For item-based splitting, an item may be assigned to one or more participants. The item subtotal, taxes, discounts, service charge, or other difference are allocated proportionally so that the final participant total equals the confirmed bill total.
5. The payer's own share is recorded as already paid; a participant may make a partial payment. A bill is settled only when every non-opted-out participant has paid their owed amount.
6. OCR output is a draft, never final financial data. It remains editable and cannot bypass the normal validation and save rules.
7. Debt clearing derives each accessible user's net position from outstanding bill obligations, offsets reciprocal obligations, and produces an explainable set of payment instructions. It never initiates a transfer or treats a suggested payment as bank-confirmed.

## 2. Product backlog

Priority: **P0** = essential MVP flow; **P1** = supporting MVP capability; **P2** = post-MVP candidate. Estimates are relative story points, not elapsed time. The team must select a viable subset within its 120-person-day capacity rather than equating points directly to hours.

| ID | Epic | Feature | User story | Priority | Estimate | Acceptance criteria | Dependency |
| --- | --- | --- | --- | --- | ---: | --- | --- |
| US-SPLIT-01 | E1 Account | Register and sign in | As a new user, I want to register and sign in, so that my bills and payments are protected. | P0 | 5 | AC-01 | Auth API; email verification policy |
| US-SPLIT-02 | E1 Account | Profile | As a signed-in user, I want to maintain my profile, so that group members can identify me. | P1 | 3 | AC-02 | US-SPLIT-01 |
| US-SPLIT-03 | E2 Groups | Create group | As an organiser, I want to create a spending group, so that I can reuse frequent members. | P1 | 5 | AC-03 | US-SPLIT-01; user search |
| US-SPLIT-04 | E2 Groups | Manage members | As a group owner, I want to add or remove group members, so that the group remains current. | P1 | 5 | AC-04 | US-SPLIT-03 |
| US-SPLIT-05 | E3 Bill setup | Bill information, payer, and participants | As a bill creator, I want to enter required bill information and select the payer and participants, so that Splitly can calculate the right obligations. | P0 | 3 | AC-05 | US-SPLIT-01; user/group search |
| US-SPLIT-06 | E3 Bill splitting | Equal split | As a bill creator, I want to divide a bill equally, so that all selected people owe the same amount. | P0 | 5 | AC-06 | US-SPLIT-05 |
| US-SPLIT-07 | E3 Bill splitting | By-person split | As a bill creator, I want to enter each person's amount or relative consumption, so that unequal usage is represented fairly. | P0 | 5 | AC-07 | US-SPLIT-05 |
| US-SPLIT-08 | E3 Bill splitting | By-item split | As a bill creator, I want to assign an item to one or more members, so that each person pays only for what they used. | P0 | 8 | AC-08 | US-SPLIT-05; item allocation |
| US-SPLIT-09 | E3 Bill lifecycle | Validate and save bill | As a bill creator, I want invalid data to be explained before saving, so that incorrect financial records are not persisted. | P0 | 8 | AC-09 | US-SPLIT-05–08; bill API |
| US-SPLIT-10 | E3 Bill lifecycle | History and detail | As a participant, I want to view bill details and status, so that I understand what I owe and why. | P0 | 3 | AC-10 | US-SPLIT-09 |
| US-SPLIT-11 | E4 Payments | Partial and full payment | As a participant, I want to record a partial or full payment, so that the outstanding balance is accurate. | P0 | 5 | AC-11 | US-SPLIT-10; payment API |
| US-SPLIT-12 | E4 Payments | Payment confirmation link | As a debtor, I want to open a secure payment request and see the amount and recipient details, so that I can make or request confirmation of payment. | P1 | 5 | AC-12 | US-SPLIT-11; token/email service |
| US-SPLIT-13 | E4 Payments | Payment reminder | As a creditor, I want to remind an unpaid participant, so that overdue payments are followed up consistently. | P1 | 5 | AC-13 | US-SPLIT-10; notification/email service |
| US-SPLIT-14 | E4 Payments | Opt out | As an incorrectly added participant, I want to opt out of a bill through a valid secure link, so that it no longer appears as my debt. | P2 | 3 | AC-14 | Post-MVP; US-SPLIT-09; opt-out token |
| US-SPLIT-15 | E5 Insights | Personal dashboard | As a user, I want to see monthly spending and amounts owed/to receive, so that I can act on my finances. | P1 | 5 | AC-15 | Bills and payment status |
| US-SPLIT-16 | E5 Insights | Advanced monthly report | As a user, I want a monthly spending report by trend and category, so that I can understand my expense pattern. | P2 | 8 | AC-16 | Post-MVP; categorised bills; report API |
| US-SPLIT-17 | E6 Transparency | Activity and notifications | As an affected user, I want visible bill events and notifications, so that changes and reminders are traceable. | P1 | 5 | AC-17 | Bill/payment/group events; transactional outbox; notification worker |
| US-SPLIT-22 | E4 Payments | Cross-bill debt clearing | As a group member, I want to see my net obligations across accessible unpaid bills and the minimum set of payment instructions, so that reciprocal debts can be cleared without losing the underlying bill history. | P0 | 8 | AC-22 | US-SPLIT-09; outstanding-payment data; authoritative debt-calculation service |
| US-SPLIT-18 | E7 AI receipt input | Upload and validate receipt | As a bill creator, I want to upload a supported receipt image, so that the system can prepare a draft safely. | P0 | 5 | AC-18 | US-SPLIT-01; image validation; Gemini adapter |
| US-SPLIT-19 | E7 AI receipt input | Extract draft | As a bill creator, I want Gemini 2.5 Flash to extract receipt fields and items into an editable draft, so that I type less information. | P0 | 8 | AC-19 | US-SPLIT-18; Gemini adapter |
| US-SPLIT-20 | E7 AI receipt input | Review and correct draft | As a bill creator, I want to correct extracted results before allocation, so that an AI error cannot become a wrong bill. | P0 | 5 | AC-20 | US-SPLIT-19; US-SPLIT-05–09 |
| US-SPLIT-21 | E7 AI receipt input | Failure and manual fallback | As a bill creator, I want a clear retry and manual-entry path when Gemini processing fails, so that I can still finish the bill. | P0 | 3 | AC-21 | US-SPLIT-18; manual bill flow |

## 3. Acceptance criteria

All examples below use VND. “Allocated total” means the final sum of participant obligations after the approved rounding rule.

| Ref. | User story | Given / When / Then acceptance criteria |
| --- | --- | --- |
| AC-01 | US-SPLIT-01 | **Given** a visitor provides valid unique registration details, **when** they submit registration and then valid credentials, **then** an account is created and protected application routes are available. **Given** a duplicate or invalid credential set, **when** it is submitted, **then** no session is created and field-level error feedback is shown. |
| AC-02 | US-SPLIT-02 | **Given** an authenticated user edits their permitted profile fields, **when** the update succeeds, **then** the stored profile and subsequently displayed identity show the new values. **When** invalid profile data is submitted, **then** it is rejected without overwriting valid data. |
| AC-03 | US-SPLIT-03 | **Given** an authenticated organiser enters a non-empty group name and optional description/members, **when** they confirm creation, **then** the group is persisted and appears in their group list. **When** the name exceeds 100 characters or is blank, **then** creation is rejected with an explanation. |
| AC-04 | US-SPLIT-04 | **Given** an existing group, **when** its authorised manager confirms a revised member selection, **then** the group detail and future participant search reflect the revised membership. **When** an invalid member payload is sent, **then** the existing list is retained. |
| AC-05 | US-SPLIT-05 | **Given** the creator opens Create Bill, **when** they provide bill name, category, creation date, deadline, one payer, participants, positive total, and split method, **then** the matching allocation form is available. **When** a mandatory field is missing, **then** save is blocked and the missing field is identified. |
| AC-06 | US-SPLIT-06 | **Given** a bill total of **120,000 VND** and three selected participants, **when** the creator chooses Equal split, **then** every participant owes **40,000 VND** and the allocated total is **120,000 VND**. **When** rounding is needed, **then** the visible shares still sum exactly to the total using the approved deterministic rounding rule. |
| AC-07 | US-SPLIT-07 | **Given** a total of **120,000 VND** and person inputs in a 1:2 relationship, **when** the system calculates the by-person allocation, **then** the participants owe **40,000 VND** and **80,000 VND** respectively. **When** supplied final amounts do not sum to the confirmed total, **then** saving is blocked and the difference is shown. |
| AC-08 | US-SPLIT-08 | **Given** a bill has one item worth **120,000 VND** assigned to three members, **when** the creator confirms the assignment, **then** each member owes **40,000 VND** and the item allocation sums to **120,000 VND**. **Given** item subtotals differ from the confirmed total because of tax, discount, service charge, or tip, **when** allocation is calculated, **then** the proportional adjustment and each final share are visible and the allocated total equals the confirmed total exactly. |
| AC-09 | US-SPLIT-09 | **Given** a bill has unresolved required fields, no valid item assignment, or a non-zero allocation difference, **when** Save Bill is selected, **then** the bill is not persisted and actionable validation feedback is shown. **Given** valid data, **when** it is saved, **then** payment statuses are created, the payer's own share is marked paid, an activity is logged, and other participants are notified without changing the saved financial result if a notification channel fails. |
| AC-10 | US-SPLIT-10 | **Given** a creator or participant opens an accessible saved bill, **when** its detail is loaded, **then** it displays bill name, payer, total, split method, relevant item/participant breakdown, amount owed/paid, and settlement status. **When** the user searches or filters history, **then** only matching accessible bills are returned. |
| AC-11 | US-SPLIT-11 | **Given** a participant owes **100,000 VND**, **when** a partial payment of **40,000 VND** is recorded, **then** their paid amount is 40,000 VND and remaining balance is 60,000 VND. **When** all eligible participant paid amounts reach their owed amounts, **then** the bill is marked settled and a settlement event is produced. |
| AC-12 | US-SPLIT-12 | **Given** a debtor opens a valid, unused payment/reminder token, **when** the payment page loads, **then** it shows the creditor, applicable bills, remaining amount, and supported payment details without exposing another user's request. **When** an expired, malformed, or already-used token is used, **then** no payment change occurs and a clear error is shown. |
| AC-13 | US-SPLIT-13 | **Given** an unpaid debt owned by the current creditor, **when** they send a reminder, **then** a reminder event is logged and the debtor receives the configured notification/email containing the outstanding amount. **When** another user attempts the same action, **then** the request is rejected. |
| AC-14 | US-SPLIT-14 | **Given** a participant opens their valid opt-out link, **when** they confirm opt-out, **then** they are excluded from their outstanding-debt view and an opt-out activity is recorded. **When** the token is invalid or belongs to another user, **then** no participant status changes. |
| AC-15 | US-SPLIT-15 | **Given** the user has bills in the current and previous month, **when** they open the dashboard, **then** it shows current-month spending, change from the previous month, amounts owed/to receive, and recent relevant activity from the same underlying bill/payment data. |
| AC-16 | US-SPLIT-16 | **Given** a user selects a month, **when** the report loads, **then** bill count, total spending, unpaid debt, overdue count, spending trend, and category breakdown are calculated from that user's accessible bills. **When** there is no data for the month, **then** a zero/empty state is shown rather than stale data. |
| AC-17 | US-SPLIT-17 | **Given** a bill is created, paid, settled, deleted, or reminded, **when** the related operation succeeds, **then** the business state and outbox event commit atomically. **When** the worker handles the event, **then** the relevant activity/notification is created idempotently for eligible users. **When** delivery fails, **then** the event remains retryable without rolling back or duplicating the financial operation. |
| AC-18 | US-SPLIT-18 | **Given** the creator supplies a JPG/JPEG, PNG, or WebP receipt image no larger than **10 MB**, **when** they start scanning, **then** the system verifies the actual MIME type and applies the approved dimension/aspect-ratio safety rules before Gemini processing. **When** the format, size, or image validation fails, **then** scanning does not start and the user can replace the file or enter manually. PDF is rejected with a clear post-MVP message. |
| AC-19 | US-SPLIT-19 | **Given** a validated receipt, **when** Gemini 2.5 Flash returns a result, **then** the system creates an editable draft containing each available merchant/bill name, date, category, line item name, quantity, unit price, line amount, subtotal, tax, discount, and total. **When** a field is missing or uncertain, **then** it is visibly marked rather than invented. |
| AC-20 | US-SPLIT-20 | **Given** an OCR draft with an uncertain price or missing item, **when** the creator edits, adds, or removes values and confirms them, **then** the corrected values carry into the normal Create Bill form. **When** the creator attempts to save with unresolved mandatory data or an allocation mismatch, **then** normal AC-05 to AC-09 validation blocks the save. |
| AC-21 | US-SPLIT-21 | **Given** OCR times out, is unavailable, or returns invalid content, **when** processing ends, **then** the user sees an understandable error and can retry, replace the image, or choose manual entry. No bill is created from a failed scan. |
| AC-22 | US-SPLIT-22 | **Given** accessible unpaid bill obligations in a group, **when** a member opens debt clearing, **then** the system shows each included outstanding obligation, each member's net balance, and deterministic payment instructions whose total payer and receiver amounts are equal. **When** A owes B **100,000 VND** and B owes A **40,000 VND**, **then** the instructions show only A paying B **60,000 VND**. **When** an underlying bill payment changes, the next calculation reflects it without altering bill history. The result is informational/payment assistance only and never marks a bank transfer or bill payment as confirmed. |

## 4. KPI plan

The KPI targets are measured from the baseline sprint. Events exclude test accounts and use a stable `billId`/user identifier policy.

| KPI | Formula and event source | Target | Cadence | Decision supported |
| --- | --- | --- | --- | --- |
| K1 Bill creation completion | `valid_bill_saved / bill_create_started`; events: `bill_create_started`, `bill_saved` | ≥ 90% monthly | Weekly | Finds form/validation friction. |
| K2 Financial allocation integrity | `saved_bills where sum(amountOwed) = totalAmount / saved_bills` | 100% | Per release and daily monitor | Guards the core financial invariant. |
| K3 Manual entry time | Median from `bill_create_started` to `bill_saved` for manual flow | Establish during UAT; proposed target ≤ 3 minutes | Per UAT cycle | Measures the baseline/fallback workflow. |
| K4 Gemini usable-draft rate | `ai_drafts_continued_to_review / successful_receipt_scans` | Establish during POC; proposed target ≥ 85% | Weekly after integration | Measures extraction usefulness, not unreviewed accuracy. |
| K5 Scan-to-saved-bill rate | `bills_saved_from_scan / receipt_scans_started` | Establish during UAT; proposed target ≥ 65% | Weekly after integration | Reveals whether scanning reduces effort. |
| K6 Payment follow-up conversion | `debts with full/partial payment within 7 days of reminder / reminders_sent` | ≥ 30% | Monthly | Tests reminder value. |
| K7 Settlement latency | Median days from bill creation to settlement | Baseline first; improve by 15% | Monthly | Shows whether payment tracking helps groups settle. |
| K8 Notification reliability | `successfully delivered notifications / notification attempts`, tracked by channel | ≥ 98% provider acceptance | Weekly | Prevents silent loss of reminders and bill events. |

## 5. Definition of Done

A user story is Done only when all applicable conditions below are true:

- The implementation satisfies every linked acceptance criterion, including the negative/error path.
- Automated tests cover the linked test cases; the financial tests include exact-total and rounding assertions.
- Request validation, authentication, and authorisation are enforced server-side; a client-side check alone is insufficient.
- Error states are understandable, do not persist partial/incorrect financial data, and provide a safe recovery path.
- Data changes are reflected in the applicable history, payment, dashboard, activity, and notification views.
- The code has passed review, lint/build checks, and regression tests for the dependent flow.
- The UI is usable at supported mobile and desktop widths and has loading, empty, and failure states.
- User-visible Vietnamese wording, labels, currency formatting, and dates are reviewed for consistency.
- Required activity/metric events are emitted without leaking receipt image data, tokens, bank account details, or other secrets.
- The relevant backlog row, acceptance criteria, prototype reference, test case, and traceability matrix are updated; known limitations are recorded rather than hidden.

For Gemini receipt stories additionally:

- The original receipt is never treated as a confirmed bill without user review.
- Supported format/size/resize rules are identical in the UI, API, help text, and tests.
- Provider failure, timeout, malformed response, and manual fallback are tested.

## 6. Requirement Traceability Matrix

Problem IDs: `P1` calculation/transcription errors; `P2` unclear reimbursement status; `P3` awkward follow-up; `P4` repeated group setup; `P5` lack of visibility/audit trail; `P6` AI extraction effort, reliability, and privacy risk. `CS-*` identifiers refer to the manual-entry comparison baseline, `FS-*` identifiers refer to the Gemini-assisted target workflow, and `C*`/`F*` refer to the matching prototype screens. These are planning baselines, not claims about an operating product.

| Problem | Workflow | Feature | User story | Acceptance criteria | Prototype screen | Test case |
| --- | --- | --- | --- | --- | --- | --- |
| P5 | CS-01; FS-01 | Register and sign in | US-SPLIT-01 | AC-01 | C01 / F01 (authenticated entry) | TC-AUTH-01 |
| P4, P5 | CS-02, CS-05; FS-09 | Profile | US-SPLIT-02 | AC-02 | C01 (account context) | TC-PROFILE-01 |
| P4 | CS-02, CS-05; FS-09 | Create group | US-SPLIT-03 | AC-03 | C01, C05 | TC-GRP-01 |
| P4 | CS-05; FS-09 | Manage members | US-SPLIT-04 | AC-04 | C05, F07 | TC-GRP-02 |
| P1, P4 | CS-03–CS-06; FS-09–FS-10 | Bill setup, payer, participants | US-SPLIT-05 | AC-05 | C03–C06; F07 | TC-BILL-01 |
| P1 | CS-07A; FS-11A | Equal split | US-SPLIT-06 | AC-06 | C06, C09 | TC-SPLIT-01 |
| P1 | CS-07B; FS-11B | By-person split | US-SPLIT-07 | AC-07 | C06, C09 | TC-SPLIT-02 |
| P1 | CS-07C, CS-08; FS-11C | By-item split | US-SPLIT-08 | AC-08 | C07–C09; F08–F09 | TC-SPLIT-03, TC-SPLIT-04 |
| P1, P5 | CS-09–CS-10; FS-12–FS-13 | Validate and save | US-SPLIT-09 | AC-09 | C09–C10; F09–F10 | TC-BILL-02 |
| P2, P5 | CS-11; FS-14 | History and detail | US-SPLIT-10 | AC-10 | C10, F10 | TC-BILL-03 |
| P2 | CS-12; FS-15 | Partial and full payment | US-SPLIT-11 | AC-11 | C11 | TC-PAY-01 |
| P2 | CS-12; FS-15 | Payment confirmation link | US-SPLIT-12 | AC-12 | C11 | TC-PAY-02 |
| P3, P5 | CS-13; FS-16 | Payment reminder | US-SPLIT-13 | AC-13 | C11 | TC-PAY-03 |
| P2, P5 | CS-11–CS-12; FS-14–FS-15 | Opt out | US-SPLIT-14 | AC-14 | C10–C11 | TC-PAY-04 |
| P5 | CS-01, CS-11; FS-14 | Personal dashboard | US-SPLIT-15 | AC-15 | C01 | TC-INS-01 |
| P5 | Post-MVP | Advanced monthly report | US-SPLIT-16 | AC-16 | No dedicated prototype screen | TC-INS-02 |
| P3, P5 | CS-10–CS-13; FS-13–FS-16 | Activity and notifications | US-SPLIT-17 | AC-17 | C10–C11, F10 | TC-NOTI-01 |
| P6 | FS-02–FS-05 | Upload and validate receipt | US-SPLIT-18 | AC-18 | F02–F04 | TC-OCR-01 |
| P6 | FS-06–FS-07 | Extract draft | US-SPLIT-19 | AC-19 | F04–F05 | TC-OCR-02 |
| P1, P6 | FS-08–FS-13 | Review and correct draft | US-SPLIT-20 | AC-20 | F05–F09 | TC-OCR-03 |
| P6 | FS-04–FS-05 | Failure and manual fallback | US-SPLIT-21 | AC-21 | F02–F06 | TC-OCR-04 |

## 7. Test-case index

The following are the minimum acceptance-level test cases. They can be expanded into detailed manual or automated test scripts without changing IDs.

| Test case | Scenario / minimum data | Expected result |
| --- | --- | --- |
| TC-AUTH-01 | Register, sign in, and submit duplicate/invalid credentials. | Valid user reaches protected area; invalid attempt creates no session and shows an error. |
| TC-PROFILE-01 | Update name/avatar/phone, refresh, then submit invalid profile data. | Valid values persist; invalid request leaves stored values unchanged. |
| TC-GRP-01 | Create group with valid details; create with blank and >100-character name. | Valid group appears; invalid groups are rejected. |
| TC-GRP-02 | Add then remove a member from an existing group. | Group detail and bill participant search use the updated member list. |
| TC-BILL-01 | Open Create Bill and omit each mandatory field in turn; select payer, people, and split type. | Missing field is identified; valid setup exposes the selected allocation form. |
| TC-SPLIT-01 | Equal split 120,000 VND among three people. | Three shares of 40,000 VND; allocated total 120,000 VND. |
| TC-SPLIT-02 | By-person split total 120,000 VND with 1:2 consumption; submit an inconsistent final allocation. | Shares are 40,000/80,000; inconsistent total cannot save. |
| TC-SPLIT-03 | Assign a 120,000-VND item to three members. | Each owes 40,000 VND; exact allocation invariant holds. |
| TC-SPLIT-04 | Allocate individual/shared items where item subtotal differs from bill total and requires rounding. | Adjustment is visible; deterministic rounding keeps final allocated total exactly equal to bill total. |
| TC-BILL-02 | Submit with no valid item/allocation mismatch, then submit a valid bill. | Invalid payload is not persisted; valid bill creates statuses, activity, and attempted notifications. |
| TC-BILL-03 | Open a bill as payer and participant; search/filter history. | Accessible detail has payer, shares, paid/owed, and status; history returns only matching accessible bills. |
| TC-PAY-01 | Record 40,000 then 60,000 against a 100,000-VND obligation; complete remaining participants. | Remaining balance becomes 60,000 then zero; bill settles only after every eligible obligation is paid. |
| TC-PAY-02 | Load payment page with valid, expired, malformed, and used tokens. | Valid token exposes only authorised request; invalid tokens change no payment data. |
| TC-PAY-03 | Creditor and non-creditor each attempt a reminder for the same debt. | Creditor reminder is logged/delivered; non-creditor receives forbidden response. |
| TC-PAY-04 | Use valid and invalid opt-out links. | Valid participant is excluded from debt views and activity is logged; invalid link has no effect. |
| TC-INS-01 | Load dashboard with known monthly bills/debts. | Spending, comparison, owed/to-receive, and recent activity match source bill/payment data. |
| TC-INS-02 | Load report for populated month and empty month. | Metrics/trend/category values match data; empty month shows an empty/zero state. |
| TC-NOTI-01 | Create, pay, settle, delete, and remind on a test bill; stop and restart the worker; replay one claimed event. | Business operations commit with outbox events; eligible users receive only relevant notifications; backlog resumes after restart; replay creates no duplicate notification or financial change. |
| TC-OCR-01 | Upload accepted and rejected images: JPG/JPEG, PNG, WebP, PDF, MIME spoof, and files above 10 MB. | Only valid supported images reach Gemini; PDF/oversized/spoofed inputs are rejected and offer safe recovery. |
| TC-OCR-02 | Scan a receipt with merchant, date, tax/discount, and several line items. | Editable draft contains available values; missing/uncertain values are clearly flagged. |
| TC-OCR-03 | Correct a malformed OCR draft, assign people/items, then attempt save with mismatch. | Corrections reach bill form; normal bill validation prevents invalid persistence. |
| TC-OCR-04 | Simulate provider timeout and malformed response. | User can retry/replace image/manual entry; no incomplete bill is saved. |

## 8. Mapping summary

```mermaid
flowchart LR
    P[Problem] --> W[Workflow step]
    W --> F[Feature]
    F --> US[User story]
    US --> AC[Acceptance criteria]
    AC --> S[Prototype screen]
    S --> TC[Test case]
    TC --> D[Definition of Done]
    D --> K[KPI monitoring]
```

This chain is the change-control rule for Splitly: a proposed feature change must update its user story, acceptance criteria, prototype reference, test case, and KPI/DoD impact before it is accepted into a sprint.

## 9. Product Backlog controls

### 9.1 Shared glossary

These terms must be used consistently in Vietnamese UI copy, stakeholder discussion, user stories, tests, and code/API documentation. They reduce the risk that a technically correct implementation solves the wrong business problem.

| Term | Agreed business meaning |
| --- | --- |
| **Bill** | One shared expense record containing its total, payer, participants, allocation, and payment progress. |
| **Payer** | The single person who paid the supplier up front for this bill. This is not necessarily every person who consumed an item. |
| **Participant** | A person included in the bill's allocation. Their obligation can be zero only when the selected split rule produces zero. |
| **Amount owed** | The participant's final allocated responsibility after adjustment and rounding. |
| **Amount paid** | The cumulative amount recorded as paid by that participant toward the bill. |
| **Remaining amount** | `amountOwed − amountPaid`, never below zero. |
| **Equal split** | The confirmed bill total is divided among selected participants using the deterministic rounding rule. |
| **By person** | The creator enters final amounts or relative consumption for participants; final amounts must still equal the confirmed total. |
| **By item** | One or more participants are assigned to each item; shared items are divided among their assigned people and any bill-level adjustment is distributed proportionally. |
| **Settled** | Every eligible, non-opted-out participant has paid at least their amount owed. It does not prove that a bank transfer happened automatically. |
| **Debt clearing** | A calculated, explainable set of net payment instructions across accessible outstanding bills. It offsets reciprocal obligations but does not delete underlying bills, initiate a transfer, or prove payment. |
| **Opt out** | A securely verified participant disputes their inclusion and is excluded from the app's outstanding-debt view; the action remains auditable. |
| **OCR draft** | Editable data extracted from a receipt image. It is not a confirmed financial record until the creator reviews, allocates, validates, and saves it. |

### 9.2 Business-value map

| Objective | Customer/business value | Success signal | Backlog items |
| --- | --- | --- | --- |
| BV-01 Fair allocation | Reduces calculation errors and disputes about who consumed what. | K2 is 100%; fewer allocation corrections. | US-SPLIT-05–09 |
| BV-02 Clear reimbursement | Makes each person's debt, payment, settlement state, and net clearing instruction visible. | K7 improves; users can identify remaining balance. | MVP: US-SPLIT-10–13, US-SPLIT-22; post-MVP: US-SPLIT-14 |
| BV-03 Lower follow-up friction | Gives creditors a structured, auditable way to remind debtors. | K6 reminder conversion. | US-SPLIT-13, US-SPLIT-17 |
| BV-04 Less repeated setup | Lets recurring social groups reuse member lists and profiles. | Reduced time to start a bill; group reuse feedback. | US-SPLIT-02–05 |
| BV-05 Spending awareness | Turns bill data into actionable personal spending information. | Dashboard/report usage and report accuracy checks. | US-SPLIT-15–16 |
| BV-06 Faster bill entry with user control | Reduces receipt transcription while preserving human confirmation of financial data. | K3, K4, and K5. | US-SPLIT-18–21 |

### 9.3 Backlog refinement and Definition of Ready

The Product Owner facilitates refinement at least once per sprint and before release planning with a developer and QA representative. Every approved change updates the affected PBI, acceptance criteria, test case, priority, estimate, and traceability link.

A PBI is **Ready for sprint selection** only when all conditions hold:

1. It has a stable ID, actor, plain-language outcome, business-value objective, priority/rank, and dependency.
2. Its acceptance criteria and at least one linked test case are unambiguous and testable.
3. Relevant workflow and prototype IDs are linked, or the lack of a screen is an accepted design action.
4. Required domain/data/API assumptions, security/privacy concerns, and open risks are visible.
5. Estimate uses the team's agreed Fibonacci scale. An 8-point item is split or explicitly approved as an exception before sprint commitment.
6. The Product Owner, developer, and QA representative agree that no unknown blocks normal implementation/testing.

### 9.4 Release Backlog and story map

The **Product Backlog** is the complete ordered set in Section 2. The **Release Backlog** is the selected, viable subset for each release.

| Release order | Release outcome / business value | Selected stories in planned order | Story points | Exit criterion |
| --- | --- | --- | ---: | --- |
| R1 — Manual core increment | Users can securely create, divide, save, and view a shared expense. | US-SPLIT-01, US-SPLIT-05–10 | 37 | The proposed manual flow passes its linked AC/test cases and preserves the financial invariant. |
| R2 — Group and settlement increment | Users reuse groups, obtain payment instructions, declare/confirm payments, send creditor reminders, and receive essential status evidence. | US-SPLIT-02–04, US-SPLIT-11–13, US-SPLIT-15, US-SPLIT-17 | 38 | R1 remains regression-safe; payment authorization, confirmation, reminder, and visibility cases pass. |
| R3 — Gemini-assisted MVP increment | Users scan a supported receipt, correct the Gemini draft, and safely fall back to manual entry. | US-SPLIT-18–21 | 21 | AC-18–AC-21, Gemini-specific DoD, privacy review, and fallback tests pass. |
| Post-MVP | Users gain advanced analysis, opt-out, and other deferred capabilities after validation. | US-SPLIT-14, US-SPLIT-16, plus the approved future backlog | 11+ | Requires separate prioritization and change approval; it is not an MVP exit dependency. |

```mermaid
flowchart LR
    A[Sign in] --> B[Enter bill data]
    B --> C[Choose split]
    C --> D[Validate and save]
    D --> E[Review and pay]
    E --> F[Remind / settle]
    A -. R2 support .-> G[Profile and group]
    D -. R2 support .-> H[Activity and basic dashboard]
    B -. R3 MVP alternative .-> I[Scan, review, correct receipt]
    I --> C
```

### 9.5 Packets — implementation change scope

A packet is the bounded set of product/code components for a release item. It is used for sprint planning and impact review.

| Packet | Backlog items | Likely components to change or verify | Primary responsibility |
| --- | --- | --- | --- |
| PKT-01 Account access | US-SPLIT-01–02 | User model/validation/controller/routes, auth middleware/JWT, Auth/Profile pages, user API client. | Development; QA verifies AC-01/02. |
| PKT-02 Group roster | US-SPLIT-03–04 | Group model/validation/controller/routes, group pages/dialogs, participant/group search. | Development and QA verify BV-04 and linked acceptance criteria. |
| PKT-03 Bill setup and allocation | US-SPLIT-05–09 | Bill validation/model/service/routes, `BillCreate`, `activeBillSlice`, payer/participant dialogs, three split components. | Development; QA executes TC-BILL-01/02 and TC-SPLIT-01–04. |
| PKT-04 Bill lifecycle and payment | US-SPLIT-10–13 | History/detail views, debt/payment/confirmation controllers, payment token pages, and creditor reminder flow. | Development; QA executes TC-BILL-03 and TC-PAY-01–03. |
| PKT-05 MVP transparency | US-SPLIT-15, US-SPLIT-17 | Essential dashboard, activity, notification APIs/pages, MongoDB outbox, worker handlers, Socket.IO/email delivery, retry and idempotency. | Development; QA executes TC-INS-01 and TC-NOTI-01. |
| PKT-06 OCR-assisted entry | US-SPLIT-18–21 | OCR page/client, bill scan validation/service/provider, bill-draft parser, create-bill integration, image/privacy/error handling. | Development; QA executes TC-OCR-01–04; Product Owner approves release gate. |
| PKT-07 Deferred capabilities | US-SPLIT-14, US-SPLIT-16 | Opt-out and advanced-report components after MVP acceptance. | Product Owner reprioritizes through post-MVP planning; they are not release dependencies. |
