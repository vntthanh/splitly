# Splitly - Existing Tools Analysis

**Document type:** Current alternatives and indirect-competitor analysis  
**Version:** 2.0  
**Research cut-off:** 16 July 2026  
**Purpose:** Explain how people currently share a bill, including a technically possible combination of existing tools, and why that combination remains complex for ordinary users.

## 1. Executive finding

Users do not lack tools. A calculator can perform arithmetic; Google Sheets/Excel can record and share a model; chat can coordinate; an open-source OCR package can extract text; and VietQR can construct a transfer QR. The issue is that the organiser has to assemble these tools manually, move data between them, decide the splitting rules and reconcile payment status outside the original bill.

This combination can work for a technically confident organiser. It is not a user-friendly default for a group meal or activity, where the person who paid wants an accurate result quickly and participants want to understand and repay their amount with little data entry.

## 2. Current tools used separately

| Tool or approach | What it does well | Limitation for an itemized shared bill | Value Splitly should provide |
| --- | --- | --- | --- |
| Calculator | Immediate arithmetic for a simple equal split. | No receipt data, participant record, allocation logic, history or payment follow-up. A change restarts the calculation. | Reusable bill model with reconciled totals. |
| Google Sheets / Excel | Flexible formulas, tables, permissions and collaboration. | Someone must transcribe receipt data, design/maintain formulas and share the correct version. Mobile use at the table is slow. | Guided mobile entry and a readable explanation without formula ownership. |
| Notes app | Very low effort for a short list of names and amounts. | No arithmetic safeguards, item assignment, settlement logic or paid-status control. | Structured bill, allocations and status instead of free text. |
| Zalo / Messenger / SMS | Fast group reach, conversation and screenshot sharing. | A conversation is not a calculation engine or ledger; details and payment proof become hard to reconcile. | Share a concise result while retaining a bill-level source of truth. |
| Bank app / e-wallet | Performs the transfer and provides a payment record. | Does not know receipt items, sharing rules or reciprocal debts; users type/verify payment data separately. | Create a request from the confirmed final balance and preserve the linked status. |
| VietQR generator | Can encode the recipient, amount and transfer information in a QR. | It does not determine a fair amount, know item assignments or clear reciprocal obligations. | Generate the QR only from a confirmed, explainable net balance. |
| Open-source OCR | Can extract text and, for some tools, document structure from an image. | OCR output is not a bill split. Receipt layout, numbers, totals and line items still need review and mapping. | Make OCR editable input with validation and a manual fallback. |
| Global expense tracker | Strong balance, group and settlement behavior. | May still require manual receipt entry and a separate local payment handoff. | Optimize the Vietnamese receipt-to-VietQR moment. |

## 3. The existing-tool combination

An organiser could construct a working process without Splitly. The following example uses freely available or general-purpose components:

```text
1. Photograph the receipt.
2. Run the image through PaddleOCR or Tesseract.
3. Inspect OCR text/structure and manually correct it.
4. Copy item names and numeric values into Google Sheets or Excel.
5. Add participants; build formulas for personal items, shared dishes,
   VAT, service fee, discount, rounding and reciprocal debts.
6. Use the sheet result to create a VietQR QR with recipient, amount
   and transfer information.
7. Send the QR and a screenshot through Zalo/Messenger.
8. Check a bank app, then manually update the sheet/chat when each
   person pays.
```

PaddleOCR is an open-source OCR/document-parsing toolkit that advertises structured Markdown/JSON output and multilingual text recognition. Tesseract is an open-source OCR engine. Google Sheets supports shared Viewer/Commenter/Editor access. VietQR's API accepts a recipient account, bank identifier, amount and transfer information to create a QR. These capabilities make the combination technically feasible. [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR), [Tesseract](https://github.com/tesseract-ocr/tesseract), [Google Sheets collaboration](https://support.google.com/a/users/answer/13309904?hl=en), and [VietQR.io API](https://vietqr.io/en/generate/)

## 4. Why the combination is still complex

| Handoff | What the organiser must do | Why it is unfriendly or risky |
| --- | --- | --- |
| Receipt image -> OCR | Install/run a tool or use an OCR service; choose an image; interpret raw output. | OCR can misread digits or collapse receipt layout. It does not know which lines are billable items. |
| OCR -> spreadsheet | Copy/paste names, quantities, prices, tax, fees, discounts and totals into the right cells. | Formatting can be lost; subtotal/total fields can be confused; every correction has to be synchronised manually. |
| Spreadsheet -> split rules | Model who consumed each item, shared-dish ratios, rounding and receipt adjustments. | Formula design is difficult on a phone and hard for participants to audit. A small edit can change many totals. |
| Bills -> final debt | Offset mutual obligations such as A owing B 10,000 VND while B owes A 2,000 VND. | The organiser must recognise reciprocal debt and calculate the 8,000 VND net amount correctly. |
| Final debt -> QR | Copy the net amount and transfer text into a VietQR generator. | A stale or mistyped amount creates a payment request that no longer matches the bill. |
| QR/chat -> payment status | Check banking notifications, chat messages or screenshots; update the sheet. | Paid/unpaid status is fragmented and reminders become socially awkward. |

The combined approach has at least six data handoffs and two independent sources of truth: the spreadsheet and the bank/chat record. It also requires each user to know which values are provisional OCR output, which values are spreadsheet formulas and which values are final payment instructions.

## 5. Comparison: combination versus Splitly

| Criterion | Existing-tool combination | Splitly target |
| --- | --- | --- |
| Receipt entry | OCR text is copied/normalized manually, or every item is typed. | OCR-assisted bill draft with a correction screen. |
| Item and shared-dish allocation | Organiser designs columns and formulas. | Assign an item to one or more people with visible allocation rules. |
| VAT/service fee/discount | Organiser creates formulas and checks reconciliation. | Present the allocation rule and reconcile to the receipt total. |
| Cross-bill debt clearing | Organiser discovers/offsets it manually. | Post-MVP candidate; the MVP keeps bill-level obligations and payment status clear. |
| QR creation | Copy the result into a separate generator. | Build a VietQR request directly from the confirmed final amount. |
| Paid/unpaid status | Bank app, messages and sheet are reconciled manually. | Keep status and reminders in the same bill/debt context. |
| User experience | Powerful for a spreadsheet-literate organiser, but fragmented for the group. | One guided experience intended for the payer and participants. |

## 6. Implications for the business case

The existence of a multi-tool workaround does not eliminate the need for Splitly. It clarifies the product's job:

1. **Eliminate avoidable handoffs.** Receipt draft, bill allocation, bill-level payment status, and QR request should be connected data rather than copied values. Cross-bill debt clearing remains a future option.
2. **Make financial logic inspectable.** Participants need to see assigned items, shared portions and adjustments before paying.
3. **Protect the approved boundary.** Deliver bill-level payment tracking first; evaluate cross-bill netting later with explicit calculation and dispute rules.
4. **Treat chat as delivery, not storage.** A summary/link can be sent through chat while bill state remains in Splitly.
5. **Keep the payment boundary clear.** Splitly prepares a bank-transfer QR; it does not need to hold funds to improve the workflow.

## 7. Sources

### External sources

1. [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) - open-source OCR/document parsing with structured output (accessed 16 July 2026).
2. [Tesseract](https://github.com/tesseract-ocr/tesseract) - open-source OCR engine (accessed 16 July 2026).
3. [Google Sheets collaboration guidance](https://support.google.com/a/users/answer/13309904?hl=en) - sharing and permissions (accessed 16 July 2026).
4. [VietQR.io generate API](https://vietqr.io/en/generate/) - recipient, bank, amount and transfer-information fields (accessed 16 July 2026).
5. [Splitwise debt simplification](https://feedback.splitwise.com/knowledgebase/articles/107220-what-is-debt-simplification) - external benchmark for reducing transfer count (accessed 16 July 2026).
