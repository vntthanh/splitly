# Feasibility Study - Splitly Project

## 1. Executive Summary

This study assesses whether a six-member student team can design, build, test, and demonstrate the Splitly MVP from the approved documentation within ten weeks. Existing repository material is treated as reference or proof-of-concept input, not as an operating product.

The recommendation is **conditional Go**. The project is feasible if the team protects the confirmed MVP boundary, proves the splitting and Gemini receipt-draft flows early, and keeps manual fallbacks for external-service failures. The assessment does not assume perfect OCR accuracy, production-scale traffic, or zero cost.

## 2. Technical Feasibility

| Area | Assessment | Conditions and evidence required |
| --- | --- | --- |
| Responsive web application | Feasible | React/Vite and Node.js/Express are suitable for a single web client and modular API. The team must confirm framework versions during implementation rather than treating reference code as the baseline. |
| Data and financial calculation | Feasible with high correctness risk | MongoDB Atlas can store the proposed aggregates, but server-side calculation, integer VND handling, deterministic rounding, authorization, and exact-total tests are mandatory. |
| Gemini receipt extraction | Feasible with provider and accuracy risk | Gemini 2.5 Flash can prepare a structured draft from JPG/JPEG, PNG, or WebP images up to 10 MB. Every result must be editable and reviewed; failure must return the user to manual entry. PDF receipt input is post-MVP. |
| VietQR and payment confirmation | Feasible within a limited boundary | Splitly generates payment instructions and records declarations/confirmations. It does not initiate transfers, receive bank webhooks, hold funds, or independently prove settlement. |
| Notifications and reminders | Feasible with moderate integration risk | The MVP uses a MongoDB transactional outbox and a notification worker from the same backend codebase. This supports retry and idempotency for reminders/payment events without requiring a separate broker. Worker failure and backlog recovery must be tested. |
| Deployment | Feasible for demonstration/UAT | Vercel frontend, Render API/worker processes, and MongoDB Atlas reduce operations work. Cold starts, worker availability, service-plan limits, secrets, CORS, backups, and demonstration readiness must be tested. |

## 3. Schedule and Resource Feasibility

The team has six members, ten weeks, and approximately two working days per member each week:

- `6 x 10 x 2 = 120 person-days`;
- approximately **960 person-hours** when one planning day is eight hours;
- approximately **12 person-days per week**.

This capacity is sufficient for the confirmed MVP only if delivery is incremental. Weeks 1-2 establish the baseline and technical proof of concept; Weeks 3-5 deliver the manual core; Weeks 6-7 integrate Gemini, VietQR, payment confirmation, and reminders; Weeks 8-10 are protected for verification, UAT, deployment, and handover.

Codex can assist all six members with drafting and review, but no fixed productivity multiplier is assumed. Generated code and documents still consume review and testing capacity.

## 4. Operational and Market Feasibility

The target users—students, young professionals, roommates, and travel or dining groups—already use receipts, calculators, spreadsheets, chat, and banking applications to settle shared expenses. Splitly proposes one structured workflow for group setup, three split methods, Gemini-assisted receipt entry, VietQR instructions, payment confirmation, reminders, and history.

Operational feasibility is plausible rather than guaranteed. It must be validated with a representative UAT group using measurable tasks: complete a bill, understand the allocation, correct an OCR error, obtain payment instructions, confirm a payment, and identify unpaid obligations.

Advanced reports, the TingTing chatbot, AI payer recommendation, and PDF receipt input remain post-MVP backlog items. Cross-bill debt clearing is included in the baseline and requires deterministic netting, an explanation of included obligations, and exact-balance tests; it remains payment assistance rather than bank settlement.

## 5. Economic Feasibility

The current planning baseline is **USD 360** for six individual Codex Plus accounts over three billing months (`6 x USD 20 x 3`). The planning assumption uses GPT-5.5 with medium reasoning; medium reasoning is a usage setting rather than a separate subscription surcharge.

Vercel, Render, MongoDB Atlas, email, Gemini, and VietQR may begin on free or limited tiers, but the project must not present them as guaranteed zero-cost services. API usage, quotas, exchange rates, taxes, domain fees, and paid-tier upgrades are variable and require monitoring. The detailed assumptions and contingency are maintained in `Cost_Time_Resources.md`.

The economic recommendation remains favorable for a student demonstration if the sponsor accepts the stated baseline and any provider overage requires change approval.

## 6. Legal, Privacy, and Ethical Feasibility

- Splitly is designed as payment assistance, not a wallet or payment intermediary: users transfer through their own banking applications and recipients confirm the result.
- This boundary reduces regulatory exposure but does not automatically exempt the project from all applicable privacy, cybersecurity, consumer, intellectual-property, provider-term, or payment-related obligations. Legal claims must be reviewed before public release.
- Receipt images, email addresses, bank details, group membership, and expense history are sensitive. The MVP should process receipt images transiently, minimize provider data, protect secrets, restrict access, redact logs, and define retention/deletion behavior.
- Gemini output is untrusted draft data. The UI must communicate uncertainty and require user verification before a financial record is saved.

## 7. Recommendation and Go/No-Go Gates

Proceed with the MVP subject to these gates:

1. Approve a server-authoritative calculation contract and pass equal, by-person, by-item, adjustment, and rounding tests.
2. Prove Gemini 2.5 Flash extraction on a representative Vietnamese receipt set with editable output and manual fallback.
3. Confirm the 10 MB JPG/JPEG, PNG, and WebP upload contract consistently across UI, API, tests, and help text.
4. Demonstrate the payment boundary: VietQR instructions, declaration, creditor confirmation/rejection, and no false automatic settlement claim.
5. Test Vercel, the Render API and worker, and MongoDB Atlas together before UAT, including secrets, CORS, cold starts, worker restart, outbox replay, and provider failures.
6. Reassess scope at the end of Week 5; defer lower-priority features rather than consuming the verification period.
