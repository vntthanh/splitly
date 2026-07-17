**SPLITLY**

# **PROJECT CHARTER**

Authorization to initiate and govern the Splitly project

**DOCUMENT 2 OF 2**

| Project name | Splitly – Smart Expense Sharing Platform |
| :---- | :---- |
| **Version** | 1.0 – Proposed baseline |
| **Prepared on** | 15 July 2026 |
| **Organizational Sponsor** | Naver/Naver Cloud – Naver AI Hackathon context |

# **1. Document Control Information**

| Project name | Splitly – Smart Expense Sharing Platform |
| :---- | :---- |
| **Project ID** | SPLITLY-TV1-CHARTER-001 |
| **Version/status** | 1.0 / Proposed baseline – pending approval |
| **Date** | 15 July 2026 |
| **Organizational Sponsor** | Naver/Naver Cloud – Naver AI Hackathon context |
| **Project Manager / Product Owner** | TBD |
| **Target duration** | Ten weeks from the charter's effective date; specific calendar dates require sponsor approval |
| **Budget/funding ceiling** | TBD – includes personnel, CLOVA quota, hosting/database, email/domain, and contingency |

# **2. Project Purpose**

The project aims to build and pilot Splitly, a Vietnamese-language web platform that helps individuals and groups create, split, track, and settle shared expenses quickly, accurately, and transparently. It addresses common problems such as error-prone manual calculations, difficulty remembering who has paid, complex debt relationships, awkward payment reminders, and the lack of a verifiable shared history.

Splitly differentiates itself through three bill-splitting methods, centralized group and debt management, receipt OCR and a CLOVA-based AI assistant, VietQR payment assistance, a payment declaration–confirmation process, and multichannel notifications.

# **3. Business Need and Project Justification**

* Reduce the time and errors involved in entering and splitting bills, especially bills with many items, taxes, and discounts.
* Create a transparent record of the upfront payer, participants, outstanding amounts, reminders, and confirmation history.
* Reduce unnecessary transfers through balance tracking and debt balancing among members.
* Localize the experience for Vietnamese users through VND, Vietnamese-language UI, domestic bank details, and VietQR.
* Demonstrate the practical value of the Naver CLOVA ecosystem in a product that can be demonstrated, measured, and extended.

# **4. High-Level Objectives and Success Criteria**

| Objective | High-level outcome | Proposed success/acceptance criteria |
| ----- | ----- | ----- |
| O1 – Core bill sharing | Allow users to register/sign in, create/edit/view bills, and split equally, by person, or by item. | 100% of approved core scenarios run end to end; allocated shares equal the bill total under the approved rounding rule. |
| O2 – Group and debt transparency | Manage groups, history, activity, amounts owed/payable, and debt balancing. | UAT confirms that users can see who owes whom, the remaining amount, and activity evidence using test data. |
| O3 – AI/OCR | Use CLOVA/ClovaX to read receipt images, return structured data, and prefill an editable draft. | At least 85% of critical fields are correct on the sponsor/PO-approved receipt UAT set; failures always offer retry or manual entry. Target requires confirmation. |
| O4 – Payment assistance | Show VietQR/bank details, record payment declarations, request recipient confirmation, and update debts. | 100% of valid scenarios provide traceability from QR/transfer to confirmation or rejection; Splitly never claims to process or hold funds. |
| O5 – UX and communication | Provide a responsive Vietnamese UI, real-time notifications, and email for critical events. | At least 90% of priority UAT scenarios pass; no open Critical/High defects at go-live; email/notification test logs are available. |
| O6 – Delivery | Provide a deployed demonstration, operational documentation, and an evidence pack within the ten-week baseline. | The sponsor/acceptance representative signs acceptance; source code, sample configuration, runbook, and post-MVP backlog are handed over. |

# **5. High-Level Scope**

## **5.1 In Scope – MVP**

* Responsive Vietnamese web application with landing page, registration/sign-in, account verification, and user profiles.
* Bill management: create, view, edit, soft delete, upfront payer, participants, payment date, category, and history.
* Three splitting methods: equal split, custom amounts by person, and by-item split, including tax/discount adjustment under an approved rule.
* Group and member management, bill-group association, and member/guest users at the level appropriate for the MVP.
* Payment-status tracking, payable/receivable debt, reminders, opt-out, debt balancing, and activity/audit trail.
* Receipt-image OCR through CLOVA/ClovaX, structured extraction, and user review/correction before bill creation.
* TingTing assistant for bill-creation support and debt analysis/advice within authorized data boundaries.
* Payment assistance: bank name/account, VietQR image, payment declaration, and recipient confirmation/rejection through an expiring token.
* Real-time notifications through Socket.IO and email through SMTP/Nodemailer; Brevo remains a legacy/alternative option subject to approval.
* Dashboard, history, activity, and monthly/category spending reports at the MVP level.
* Node/Express backend, MongoDB, JWT authentication, validation, logging, environment configuration, demonstration deployment, and handover documentation.

## **5.2 Out of Scope Unless Approved Through Change Control**

* Splitly holding funds, operating a wallet, directly settling bank transactions, or guaranteeing that a transfer succeeded.
* Payment gateways with webhook/automatic reconciliation, including PayOS, MoMo, ZaloPay, or cards; the current VietQR implementation only generates QR images and uses manual confirmation.
* Native iOS/Android applications, offline-first operation, or offline synchronization.
* Multiple currencies, exchange rates, recurring bills, subscriptions, commercial billing, official PDF receipts, or accounting integrations.
* Automated dispute decisions, lending/credit, or legally binding personal financial advice.
* International expansion, OCR for every language/format, or a guarantee of perfect accuracy.
* Large-scale production deployment or a 24/7 SLA before budget, security review, and operations receive sponsor approval.

## **5.3 Major Deliverables**

| ID | Deliverable | Description |
| ----- | ----- | ----- |
| D1 | Product and UX baseline | Personas, prioritized backlog, acceptance criteria, prototype/flows, and design decisions. |
| D2 | Frontend web application | Authentication, dashboard, bills, groups, debt/payment, history/activity/reporting, OCR, and chatbot screens. |
| D3 | Backend/API and data | REST API, business logic, MongoDB models, authentication/validation, notification/email/socket functions, and audit trail. |
| D4 | External integrations | CLOVA/ClovaX OCR/chat, VietQR images, SMTP/email, and database/hosting with appropriate fallbacks. |
| D5 | Quality evidence | Test plan/results, UAT record, defect log, security/privacy checklist, and performance smoke test. |
| D6 | Release and handover | Demonstration deployment, configuration template, runbook, user guide, known limitations, and post-MVP backlog. |
| D7 | Governance documents | Stakeholder Analysis, Project Charter, status/RAID/change/decision logs, and approval record. |

# **6. Major Milestones**

| ID | Milestone | Proposed timing | Exit/approval criteria |
| ----- | ----- | ----- | ----- |
| M0 | Charter and stakeholder baseline approved | Week 1 | Sponsor representative and PM assigned; scope, KPIs, schedule, budget, and communication plan approved. |
| M1 | Requirements, UX, and architecture baseline | Week 2 | Prioritized backlog, acceptance criteria, data/API contracts, and preliminary threat/privacy review approved. |
| M2 | Core MVP feature complete | Weeks 3–5 | Authentication, bill splitting, groups, debt, history, and activity work in the test environment. |
| M3 | AI/OCR integration complete | Weeks 5–6 | CLOVA OCR/chat runs end to end; receipt test set and manual correction/fallback are tested. |
| M4 | VietQR, payment confirmation, and notifications complete | Weeks 6–7 | QR/bank information, submit/confirm/reject, email, and real-time notifications run end to end. |
| M5 | System test, security review, and UAT | Weeks 8–9 | Exit criteria met; no open Critical/High defects; OCR/UAT metrics reported. |
| M6 | Release/demonstration, acceptance, and handover | Week 10 | Demonstration deployment, evidence pack, runbook, backlog, and final approval completed. |

# **7. Key Stakeholders**

| Group | Representative | High-level role |
| ----- | ----- | ----- |
| Project Sponsor | Naver/Naver Cloud / authorized organizing-committee representative (TBD) | Approval, sponsorship, escalation, go/no-go |
| Project Manager / Product Owner | TBD – Splitly team | Value, scope, plan, stakeholders, acceptance |
| Development team | Frontend, backend, UX, QA, DevOps | Design, build, test, release, support |
| End users | Young professionals, roommates, travel/social groups; members and guests | Needs, feedback, UAT, adoption |
| OCR/AI provider | Naver Cloud CLOVA Studio/ClovaX | Multimodal AI/chat API, quota, availability |
| VietQR/payment support | VietQR/img.vietqr.io + users' banks | Generate QR/payment instructions; does not confirm settlement for Splitly |
| Supporting providers | Legacy SMTP/Nodemailer/Brevo, MongoDB/hosting | Email, data, deployment, availability |
| Acceptance stakeholders | Judges, lecturers, advisors, and acceptance representatives | Rubric, feedback, evaluation, acceptance |

# **8. Project Authority and Governance**

## **8.1 Authority Granted by This Charter**

Once the charter is signed, the Project Manager is authorized to coordinate committed personnel, manage the backlog and schedule, convene meetings, request reports, approve operational changes within the baseline, manage risks/issues, and organize acceptance. This authority does not include signing provider contracts, increasing the budget, changing project objectives, or releasing to production with unaccepted risks.

| Role | Decision authority |
| ----- | ----- |
| Sponsor | Charter, budget ceiling, MVP baseline, major changes, residual-risk acceptance, go/no-go, and final acceptance. |
| PM/PO | Backlog priority, work allocation within available resources, and changes that do not alter project objectives/MVP and affect schedule/budget by no more than 10%. |
| Technical Lead | Architecture, API/data contracts, coding/security standards, and technical choices within approved constraints; may recommend stopping a release when risks are unacceptable. |
| QA/UAT Lead | Test strategy, entry/exit criteria, and defect severity; does not recommend release while unaccepted Critical/High defects remain. |
| Provider Owner/DevOps | Keys, quota, configuration, monitoring, incident response, and fallback; may not independently change contracts/providers that affect data or cost. |

## **8.2 Escalation and Change Control**

* The sponsor approves every change to the project purpose, MVP in/out scope, sensitive data, payment model, or primary provider.
* An expected impact greater than 10% of the schedule or budget ceiling, or a need for resources beyond the commitment, requires a change request and sponsor approval.
* Critical issues—data leakage, incorrect money/debt calculations, demonstration/UAT outage, provider breach, or authentication vulnerability—must be reported immediately to the Technical Lead/PM and to the sponsor within two hours.
* The PM records decisions in the decision/change log; verbal discussions do not constitute formal approval.
* Go-live requires sign-off by the PO, Technical Lead, QA, and Sponsor/acceptance representative; every exception must record the residual risk and owner.

# **9. Assumptions**

| ID | Assumption |
| ----- | ----- |
| A1 | The sponsor/organizing committee can appoint an authorized representative and PM/PO in Week 1. |
| A2 | The development team has sufficient React, Node/Express, MongoDB, and Socket.IO skills and can commit the effort required by the ten-week baseline. |
| A3 | CLOVA/ClovaX provides an API key, image-capable endpoint/model, quota, and terms suitable for demonstration/UAT. |
| A4 | VietQR/img.vietqr.io continues to accept URLs containing bank code, account number, and amount; users provide correct information. |
| A5 | Users have a modern browser, internet access, email, and an image-capture/upload device; bank transactions occur outside Splitly. |
| A6 | The MVP primarily uses Vietnamese and VND; the UAT receipt set represents target formats. |
| A7 | MongoDB/hosting and SMTP are available; UAT may use synthetic or anonymized data. |
| A8 | Payment recipients respond to confirmation/rejection within the token validity period; disputes are handled outside the MVP. |

# **10. Constraints**

| Constraint | Description |
| ----- | ----- |
| C1 – Time/resource | Hackathon/course context, small team, and fixed deadline; official schedule and budget remain TBD. |
| C2 – Provider dependency | OCR/chat, QR, email, database, and hosting require internet access, credentials, and quota and remain subject to third-party changes/SLAs. |
| C3 – Payment boundary | Splitly has no bank webhook or payment gateway; a QR image does not prove that funds arrived. Results depend on declarations and confirmations. |
| C4 – Data/privacy | Emails, bank accounts, receipt images, and spending history are sensitive; secrets must not be committed/logged, and retention/access controls are required. |
| C5 – OCR variability | Image quality, language, layout, and model behavior introduce errors; review, editing, and manual fallback are mandatory. |
| C6 – Current technical scope | Responsive web application; current image limit is 10 MB; native, offline, multi-currency, and recurring features are outside the MVP. |
| C7 – Quality | Do not release with unaccepted Critical/High defects; splitting and debt-state calculations require testing. |
| C8 – Compliance | All provider logos/APIs and data processing must comply with applicable terms and regulations at implementation time. |

# **11. High-Level Risks and Responses**

| ID | Risk | Level | High-level response |
| ----- | ----- | ----- | ----- |
| R1 | CLOVA API, quota, or model fails or changes | High | Contract tests, monitoring, caching/timeouts, retry, manual entry, and provider owner. |
| R2 | OCR extracts incorrect amounts, dates, or items | High | Never auto-save; highlight fields; review/edit; representative test set; accuracy logging. |
| R3 | QR/bank information is incorrect or VietQR is unavailable | High | Validate and confirm bank/account details; show text for manual transfer; never mark paid automatically. |
| R4 | False payment declaration or dispute | High | Expiring token, recipient confirmation/rejection, audit trail, pending state, and support process. |
| R5 | PII, secrets, or receipt data leaks | High | Environment secrets, least privilege, TLS, log redaction, synthetic test data, and access/retention review. |
| R6 | Scope creep or schedule delay | High | MVP priorities, change thresholds, early demonstration slice, and burn-up/RAID review. |
| R7 | Email is not delivered | Medium | Delivery logs, retry, in-app/real-time notification, and alternative SMTP/provider. |
| R8 | Incorrect splitting or debt-balancing logic | High | Unit/property tests, reconciliation invariants, UAT cases, and QA stop-release authority. |

# **12. Approval Section**

By signing below, the parties confirm that they have read and approved the project's purpose, objectives, high-level scope, milestones, authority, assumptions, constraints, and governance. The charter becomes effective when the Project Sponsor signs it and critical TBD fields are completed. Subsequent changes follow the change-control process in Section 8.2.

| Role | Name/organization | Decision | Signature | Date |
| ----- | ----- | ----- | ----- | ----- |
| Project Sponsor | TBD – authorized representative | ☐ Approved<br>☐ Conditionally approved<br>☐ Not approved |  |  |
| Project Manager / Product Owner | TBD | ☐ Approved<br>☐ Conditionally approved<br>☐ Not approved |  |  |
| Development / Technical Lead | TBD | ☐ Approved<br>☐ Conditionally approved<br>☐ Not approved |  |  |
| QA / Acceptance Representative | TBD | ☐ Approved<br>☐ Conditionally approved<br>☐ Not approved |  |  |
