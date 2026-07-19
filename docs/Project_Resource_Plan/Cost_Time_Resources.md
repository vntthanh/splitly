# Splitly Cost, Time, and Resource Baseline

## 1. Purpose

This document records the approved planning assumptions for delivering the Splitly MVP from project documentation. It is a forecast for a ten-week student project, not a record of an already operating product.

## 2. Approved Baseline

| Item | Approved assumption |
| --- | --- |
| Team | Six members |
| Duration | Ten weeks |
| Availability | Approximately two working days per member per week |
| Planning day | Eight hours |
| Gross capacity | 120 person-days / 960 person-hours |
| AI development tool | Six individual Codex Plus accounts |
| Model assumption | GPT-5.5 with medium reasoning |
| Frontend hosting | Vercel |
| Backend hosting | Render API and notification-worker processes |
| Database | MongoDB Atlas |
| Receipt extraction | Gemini 2.5 Flash API |
| Current receipt formats | JPG/JPEG, PNG, and WebP, maximum 10 MB |
| Future input backlog | PDF receipt support |

## 3. Time Allocation

| Workstream | Planned share | Person-days | Person-hours | Typical outputs |
| --- | ---: | ---: | ---: | --- |
| Planning, requirements, UX, and architecture | 20% | 24 | 192 | Charter, scope, backlog, prototype, contracts, proof-of-concept plan |
| Core application development | 35% | 42 | 336 | Authentication, groups, manual bill flow, three split methods, history |
| External integrations and payment workflow | 20% | 24 | 192 | Gemini draft, VietQR, confirmation, reminders, notification paths |
| Verification, UAT, security, and defect correction | 20% | 24 | 192 | Automated/manual tests, privacy/security checks, UAT evidence, fixes |
| Deployment and handover | 5% | 6 | 48 | Vercel/Render/Atlas deployment, runbook, known limitations, final report |
| **Total** | **100%** | **120** | **960** |  |

The distribution is a planning envelope, not a guarantee. The PM may move effort between workstreams while preserving the MVP boundary and the protected verification period.

## 4. Direct Cost Estimate

| Cost item | Quantity and period | Unit planning cost | Baseline cost | Treatment |
| --- | --- | ---: | ---: | --- |
| Codex Plus | 6 accounts x 3 billing months | USD 20/account/month | **USD 360** | Committed planning baseline; one account per member, no credential sharing |
| Vercel frontend | 10-week project | USD 0 assumed | USD 0 | Use a suitable free/student tier if available; upgrade requires approval |
| Render API and worker | 10-week project | USD 0 assumed | USD 0 | Validate whether the selected Render plan can run both processes; any required worker/service upgrade uses the reserve and requires approval |
| MongoDB Atlas | 10-week project | USD 0 assumed | USD 0 | Use a suitable free tier and monitor storage/connection limits |
| Gemini 2.5 Flash API | Development and UAT usage | Usage-dependent | USD 0 baseline | Operate within available free credits/allowance; monitor tokens and requests |
| Email and VietQR | Development and UAT usage | Usage-dependent | USD 0 baseline | Use available limited tiers/services; monitor quota and terms |
| Domain and certificates | Optional | Variable | USD 0 baseline | Provider URLs and managed HTTPS are sufficient for the demonstration |
| **Baseline direct cost** |  |  | **USD 360** | Excludes labor valuation and contingency |

Free-tier amounts are assumptions to validate at implementation time, not permanent price commitments. Provider prices, tax, currency conversion, and sponsorship credit may change.

## 5. Contingency and Cost Control

The recommended management reserve is **20% of the baseline direct cost**, or **USD 72**, making a proposed funding ceiling of **USD 432**. The reserve is not automatically spent.

It may be used only with PM/PO approval for a short hosting upgrade, Gemini overage, email quota, or another demonstrably necessary release expense. Any request that would exceed USD 432, introduce a paid payment provider, or extend beyond ten weeks requires sponsor change approval.

## 6. Labor Valuation

Student labor is treated as an in-kind academic contribution, so the baseline cash budget does not assign it a salary cost. For transparency, the project records **960 planned person-hours**. If an economic labor value is later required, it must be calculated as:

```text
labor value = 960 hours x approved hourly rate
total economic cost = labor value + direct cost + approved contingency spending
```

No hourly rate is assumed without sponsor or course guidance.

## 7. Monitoring Rules

- The PM reviews actual person-days, remaining work, and provider usage every week.
- Each account and API key has an assigned owner; credentials are not shared or committed to the repository.
- Gemini requests used for testing should use representative but synthetic or anonymized receipt data when possible.
- Lower-priority work is deferred before requesting more time or budget.
- PDF input, TingTing chatbot, advanced reports, and AI payer recommendation are maintained as future backlog and consume no MVP capacity unless change control approves them. Cross-bill debt clearing is planned MVP work and must include calculation, explanation, and test capacity.

## 8. Pricing Reference

The Codex Plus unit-price assumption was checked against the [official Codex pricing documentation](https://learn.chatgpt.com/docs/pricing) on 16 July 2026. The estimate must be rechecked before purchase because plan prices, included limits, taxes, and currency conversion may change.
