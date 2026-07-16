**SPLITLY**

# **STAKEHOLDER ANALYSIS**

**DOCUMENT 1 OF 2**

| Project name | Splitly – Smart Expense Sharing Platform |
| :---- | :---- |
| **Version** | 1.0 – Proposed baseline |
| **Prepared on** | 15 July 2026 |
| **Organizational Sponsor** | Naver/Naver Cloud – Naver AI Hackathon context |

# **1. Executive Summary**

Splitly is a shared-expense web application for Vietnamese users. The product supports three bill-splitting methods—equal, by person, and by item—together with group management, debt tracking, payment reminders, VietQR transfers, payment confirmation, spending reports, real-time notifications, and an AI/OCR assistant from the CLOVA ecosystem.

# **2. Sponsor Identification**

| Sponsor | Naver/Naver Cloud – the organization associated with the Naver AI Hackathon context and the CLOVA platform used by the project. |
| :---- | :---- |
| **Role** | Provide strategic sponsorship and resources; validate objectives; set priorities; remove organizational obstacles; and approve scope, milestones, and success criteria. |
| **Authority** | Approve or reject the Project Charter; appoint the Project Manager/Product Owner; approve changes above the delegated threshold; make go/no-go decisions; and provide project-level acceptance. |
| **Influence** | Very high – determines project legitimacy, priority, access to the CLOVA ecosystem, and demonstration/evaluation criteria. |

## **2.1 Sponsor Expectations**

* A product that solves a real problem by reducing errors and awkwardness when splitting expenses while making debt tracking transparent and fair.
* A clear demonstration of AI/CLOVA value through the TingTing assistant and receipt-scanning flow, producing an editable draft that users review before saving.
* A Vietnamese-localized, responsive desktop/mobile experience that is stable enough for demonstration and UAT.
* A safe and transparent payment flow: generate VietQR/payment instructions, let the payer declare payment, and let the recipient confirm it; Splitly does not hold funds.
* An MVP delivered on schedule with measurable acceptance criteria and controls for personal-data and provider-dependency risks.
* Documentation, demonstrations, and reports clear enough to assess product value, technical quality, and future growth potential.

# **3. Stakeholder Register**

| Stakeholder | Role/interest | Power | Interest | Desired engagement | Notes |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Sponsor – Naver/Naver Cloud / Organizing Committee | Sponsorship, approval, direction | High | High | Leading / manage closely | Authorized signatory: TBD |
| Splitly Project Manager / Product Owner | Coordinate value, scope, and schedule | High | Very high | Leading / manage closely | Official assignee: TBD |
| Splitly development team | Frontend, backend, UX, QA, DevOps | High | Very high | Leading / collaborate daily | Specific roles must be assigned |
| End users | Young professionals, roommates, travel groups, clubs; members and guests | Medium | Very high | Supportive / keep informed and co-design | Source of needs and UAT evidence |
| OCR/AI provider – Naver Cloud CLOVA Studio/ClovaX | Multimodal AI and chatbot APIs | High | Medium | Neutral / keep satisfied | Depends on keys, endpoints, quota, and model |
| VietQR provider – img.vietqr.io/VietQR | Generate transfer QR images from bank, account, and amount data | High | Low–medium | Neutral / keep satisfied | Not a payment gateway in the current system |
| Email provider – SMTP/Nodemailer; legacy Brevo | Verification, reminders, payment confirmation | Medium | Low–medium | Neutral / monitor | Deliverability and secrets must be controlled |
| Data/hosting provider – MongoDB/hosting | Storage, operation, and backup | High | Low–medium | Neutral / keep satisfied | Affects availability and security |
| Judges, lecturers, and advisors | Evaluation, feedback, and academic/hackathon acceptance | High | Medium | Supportive / update at milestones | Evaluation criteria must be confirmed |

# **4. Needs, Responsibilities, Authority, and Influence**

## **Sponsor**

| Needs/expectations | Visibility into value, progress, risks, CLOVA usage, and acceptance evidence. |
| :---- | :---- |
| **Responsibilities** | Appoint the PM/PO; approve the charter and baseline; sponsor resources; resolve escalations; and make go/no-go decisions. |
| **Authority and influence** | Final approval authority; very high influence. |

## **Project Manager / Product Owner**

| Needs/expectations | Clear objectives, a prioritized backlog, committed resources, and delegated decision authority. |
| :---- | :---- |
| **Responsibilities** | Manage scope, time, quality, and risk; coordinate stakeholders; maintain RAID/change logs; report to the sponsor; and organize UAT. |
| **Authority and influence** | Operational decisions within the baseline; high influence. |

## **Development Team**

| Needs/expectations | Clear, testable requirements and acceptance criteria; environments and API keys; fast feedback; and consistent technical standards. |
| :---- | :---- |
| **Responsibilities** | Design, build, review, test, fix defects, protect secrets, document, deploy, and support demonstrations. |
| **Authority and influence** | Delegated technical decisions; high influence on quality and schedule. |

## **End Users**

| Needs/expectations | Fast Vietnamese-language interactions, correct splitting, transparent history, editable OCR results, protected data, and easy payment. |
| :---- | :---- |
| **Responsibilities** | Provide feedback; participate in research/UAT; enter accurate bank information; and confirm transactions honestly. |
| **Authority and influence** | Low–medium direct decision authority but very high influence on product fit and acceptance. |

## **CLOVA/ClovaX Provider**

| Needs/expectations | Valid requests; compliant API, key, quota, and content usage; and incident handling through supported channels. |
| :---- | :---- |
| **Responsibilities** | Provide APIs, models, and documentation; announce changes/outages; and maintain security and the agreed SLA. |
| **Authority and influence** | No project-governance authority, but high technical power because OCR/chatbot functions depend on the provider. |

## **VietQR Provider**

| Needs/expectations | Valid URLs and parameters, reasonable traffic, brand/term compliance, and no claims beyond the service's capability. |
| :---- | :---- |
| **Responsibilities** | Provide usable QR images, publish changes, and support incidents according to service policy. |
| **Authority and influence** | High influence on the QR flow; does not confirm transfers or hold funds for Splitly. |

## **Email Provider**

| Needs/expectations | Correct SMTP/API configuration, abuse prevention, protected secrets, and non-spam content. |
| :---- | :---- |
| **Responsibilities** | Deliver verification, reminder, and confirmation emails; provide logs or failure status where available. |
| **Authority and influence** | Medium influence on onboarding and payment confirmation. |

## **Data/Hosting Provider**

| Needs/expectations | Appropriate capacity, connectivity, security, backup, and monitoring configuration. |
| :---- | :---- |
| **Responsibilities** | Provide infrastructure, availability, logs, and recovery according to the service plan. |
| **Authority and influence** | High influence on the entire service; low project decision authority. |

## **Judges, Lecturers, and Advisors**

| Needs/expectations | A rubric-aligned demonstration, clear documentation, result evidence, and honest technical boundaries. |
| :---- | :---- |
| **Responsibilities** | Clarify criteria, review checkpoints, provide feedback, and evaluate/accept within their authority. |
| **Authority and influence** | High influence on acceptance and medium influence on daily operation. |

# **5. Power–Interest Matrix**

|  | Low–medium interest | High interest |
| ----- | ----- | ----- |
| High power | **KEEP SATISFIED**<br>• CLOVA/ClovaX provider<br>• VietQR provider<br>• MongoDB/hosting<br>• Email provider<br><br>Strategy: monitor SLA, quota, and changes; avoid unnecessary disruption; maintain fallbacks. | **MANAGE CLOSELY**<br>• Sponsor/organizing committee<br>• PM/PO<br>• Development lead/core team<br>• Judges/acceptance representatives<br><br>Strategy: make joint decisions, hold checkpoints, report risks, and request approval at the correct threshold. |
| Low–medium power | **MONITOR**<br>• Public outside the target group<br>• Interested non-users<br><br>Strategy: monitor general feedback and communicate when needed. | **KEEP INFORMED / INVOLVE**<br>• Member end users<br>• Guest users<br>• UAT/support users<br><br>Strategy: conduct interviews, usability tests, UAT, release notes, and feedback channels. |

# **6. Issues Requiring Discussion and Decision**

| # | Topic | Decision question | Lead | Due |
| ----- | ----- | ----- | ----- | ----- |
| 1 | Sponsor identity and authority | Who is the authorized signatory? Who decides go/no-go and major changes? | Sponsor/organizing committee | Before charter approval |
| 2 | PM/PO and team roles | Who is ultimately accountable? Who serves as technical lead, QA, DevOps, and UX? | Sponsor + team lead | Week 1 |
| 3 | Baseline scope | What is mandatory for the MVP and out of scope? What are the priorities of OCR, chatbot, reporting, and real-time features? | PM/PO + sponsor | Week 1 |
| 4 | Schedule and budget | What are the start/end dates, resources, API/hosting costs, and contingency? | Sponsor + PM | Week 1 |
| 5 | OCR/AI | Which model, quota, accuracy target, receipt test set, image-processing rights, retention, and manual fallback apply? | Technical lead + CLOVA + PO | Before integration |
| 6 | VietQR/payment | Is VietQR limited to QR generation? How are false payment claims, timeouts, bank failures, and legal messages handled? | PO + technical team + provider | Before payment UAT |
| 7 | Security and privacy | How are PII, bank data, receipt images, JWTs, secrets, CORS, logs, and deletion rights handled? | Technical lead + sponsor | Before pilot |
| 8 | Acceptance criteria | What splitting accuracy, UAT pass rate, OCR accuracy, performance, severity, and browser/device criteria apply? | PO + QA + sponsor | Before testing |
| 9 | Operations | Who owns hosting, domain, monitoring, backup/restore, support, and incident response? | DevOps + PM | Before release |
| 10 | Change control | What schedule/budget/scope thresholds, change-request template, approver, and response time apply? | Sponsor + PM | At charter approval |

# **7. Communication Plan**

| Audience | Information | Channel/artifact | Frequency | Owner | Record/escalation |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Sponsor/organizing committee | Status, KPIs, milestones, top risks, decisions | Steering review + one-page status report | Every two weeks and when thresholds are exceeded | PM | Decision log; response within two business days |
| PM/PO + core team | Backlog, blockers, changes, tests, dependencies | Daily stand-up + board/chat | Daily | PM/Scrum Lead | Blockers older than 24 hours escalate to PM |
| Development team | Design, API contract, code quality, release readiness | Repository issue/PR + technical sync | Per PR; sync twice weekly | Technical Lead | ADR/PR is the authoritative source |
| End users/UAT | Prototype, usability, defects, acceptance | Interview/test session + survey | End of each increment and before release | PO/UX/QA | Obtain consent and anonymize feedback |
| CLOVA provider | API changes, quota, errors/latency, security | Provider console/ticket/email | At integration milestones and during incidents | Technical Lead | P1: switch immediately to manual fallback |
| VietQR provider | URL format, availability, terms, QR failure | Documentation/status/ticket | Before UAT and during changes/incidents | Backend/Frontend Lead | Hide QR and show bank details on failure |
| Email + hosting/data providers | Delivery, uptime, backup, capacity, secrets | Dashboard/log/ticket | Weekly; automated alerts | DevOps | P1: incident channel + PM |
| Judges, lecturers, and advisors | Demonstration readiness, evidence, questions/feedback | Checkpoint/demonstration pack | By milestone/evaluation round | PM/PO | Meeting minutes + action list |

## **7.1 Communication Rules**

* Maintain one source of truth: backlog/issue tracker for work, repository for technical artifacts, decision log for decisions, and risk log for risks.
* Meeting minutes must record decisions, owners, due dates, and status and must be issued within 24 hours.
* Do not send API keys, JWT secrets, bank data, or real receipt images through public chat channels.
* Report P1 incidents—service outage, data leakage, or incorrect financial calculations—to the PM/Technical Lead immediately; notify the sponsor within two hours and provide updates until closure.
* Changes affecting the MVP, schedule/budget by more than 10%, personal data, or a provider require a change request and approval under the charter.
