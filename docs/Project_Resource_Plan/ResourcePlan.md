# Resource Plan - Splitly Project

## 1. Purpose and Planning Basis

This document defines the people, tools, environments, and effort available to build the Splitly MVP from the approved project documentation. The repository may contain reference code or proof-of-concept material, but it is not treated as an operating product or as evidence that an MVP feature is complete.

The baseline is a ten-week student project delivered by six members. Each member contributes approximately two working days per week. One planning day is treated as eight hours for capacity estimation; actual weekly availability may vary around classes and examinations.

## 2. Human Resources and Responsibilities

Roles are primary responsibilities rather than rigid job boundaries. Every member participates in review, testing, documentation, and integration.

| Primary role | Quantity | Main responsibilities |
| --- | ---: | --- |
| Project Manager / Business Analyst | 1 | Coordinate scope, schedule, risks, decisions, requirements, workflows, and stakeholder communication. |
| UI/UX Designer / Frontend Developer | 1 | Maintain the prototype and design system; implement responsive and accessible user journeys. |
| Frontend Developer | 1 | Implement client-side workflows, state management, API integration, validation feedback, and Vietnamese localization. |
| Backend Developer / AI Integration Engineer | 1 | Design APIs and data contracts; integrate Gemini 2.5 Flash receipt extraction and its manual fallback. |
| Backend Developer | 1 | Implement authoritative splitting, groups, payment tracking, VietQR assistance, authorization, and audit behavior. |
| QA / Tester / DevOps | 1 | Define and execute tests; manage quality gates, deployment configuration, monitoring, and release evidence. |

## 3. Capacity and Effort Baseline

- Team size: **6 members**.
- Duration: **10 weeks**.
- Commitment: **2 person-days per member per week**.
- Weekly capacity: `6 x 2 = 12 person-days`, or approximately **96 person-hours**.
- Project capacity: `6 x 10 x 2 = 120 person-days`, or approximately **960 person-hours**.

This is gross capacity. Sprint commitments must reserve time for meetings, integration, defect correction, and academic schedule risk; the team must not plan all 960 hours as feature-development time.

| Phase | Weeks | Approximate team capacity | Primary focus |
| --- | --- | ---: | --- |
| Initiation and baseline | 1-2 | 24 person-days | Charter, scope, backlog, architecture, prototype, environment, and calculation proof of concept. |
| Core MVP development | 3-5 | 36 person-days | Authentication, groups, manual bill entry, three split methods, validation, history, and payment state. |
| Integration development | 6-7 | 24 person-days | Gemini receipt scanning, review/correction, VietQR, confirmation, reminders, and notifications. |
| Verification and release | 8-10 | 36 person-days | Integration tests, security/privacy checks, UAT, defect fixing, deployment, and handover. |

## 4. Development Environment and Tools

| Area | Baseline choice |
| --- | --- |
| Product and code management | GitHub for source control, issues, pull requests, and review; the team may use Trello or Notion for planning and Discord or Zalo for communication. |
| Design | Figma for wireframes, prototype screens, and shared UI decisions. |
| Web and API | React/Vite frontend; Node.js/Express backend; MongoDB Atlas database. |
| AI receipt extraction | Gemini 2.5 Flash API behind a server-side provider adapter. Extracted values remain an editable draft until user confirmation. |
| Payment assistance | VietQR instructions and QR image generation; Splitly does not hold or transfer funds. |
| Deployment | Vercel for the frontend, Render for the API and notification worker, and MongoDB Atlas for application data and the transactional outbox. |
| AI development assistance | Six individual Codex Plus accounts, one per member, using GPT-5.5 with medium reasoning as the planning assumption. Credentials must not be shared. |

AI-generated code, tests, and documentation are drafts that remain subject to human review. Financial calculations, authorization rules, external API usage, and privacy-sensitive behavior require explicit verification by the responsible team member.

## 5. Resource Schedule

| Period | Main allocation |
| --- | --- |
| Weeks 1-2 | PM/BA and UI/UX lead the baseline; backend validates calculation, data, Gemini, and deployment feasibility; QA prepares acceptance tests. |
| Weeks 3-5 | Frontend and backend implement the smallest end-to-end manual bill flow while QA tests incrementally. |
| Weeks 6-7 | The AI engineer integrates Gemini 2.5 Flash; the team completes payment assistance and notification paths without weakening the manual fallback. |
| Weeks 8-9 | QA/UAT becomes the priority; developers fix defects and validate security, data integrity, provider failure, and responsive behavior. |
| Week 10 | DevOps prepares the demonstration deployment and handover evidence; PM closes acceptance items and records remaining backlog. |

## 6. Resource Risks and Mitigation

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Classes, examinations, or illness reduce the planned two days per week. | High | Track actual availability weekly, protect Weeks 8-10 for integration and correction, and reduce lower-priority scope through change control. |
| Six members work on dependent components concurrently. | Medium | Define module owners, API contracts, small pull requests, mandatory review, and scheduled integration checkpoints. |
| Limited experience with receipt extraction or financial allocation. | High | Build early proof-of-concept tests, keep Gemini behind an adapter, require human review, and preserve manual entry. |
| External services are unavailable, rate-limited, or change terms. | High | Use timeouts and safe error handling; retain manual entry and copyable bank instructions; queue notification events in the outbox and retry them through the worker. |
| AI-assisted development introduces incorrect or insecure output. | High | Never accept generated output without owner review, automated checks, security review, and traceability to approved requirements. |
| Free hosting tiers sleep or impose quotas. | Medium | Document cold-start limitations, monitor quota before demonstrations, prepare a test run, and record any required paid upgrade through change control. |
