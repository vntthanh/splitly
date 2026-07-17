# Project Proposal - Splitly

**Document type:** Draft business proposal  
**Version:** 2.0 draft  
**Date:** 16 July 2026  
**Supporting documents:** [Competitor Analysis](Competitor_Analysis.md) and [Existing Tools Analysis](Existing_Tools_Analysis.md)

## 1. Purpose

This draft answers **why Splitly should be built**. It covers the shared-expense problem, current tools, direct and indirect competitors, market gap, business value and the reason for choosing the solution. Product vision, in-scope/out-of-scope decisions, workflow design, prototypes, acceptance criteria and technical architecture belong to the later project documents.

## 2. Problem statement

When one person pays for a group meal, trip or activity, they become the unpaid coordinator. They must retain the receipt, ask who consumed which item, calculate personal and shared portions, distribute VAT/service fee/discount, communicate the result, send payment details and follow up on unpaid people.

The arithmetic becomes difficult when the group does not consume equally. Shared dishes, discounts, service charges, rounding and reciprocal debts create a result that is hard to explain in a chat message. For example, A may owe B 10,000 VND from one bill while B owes A 2,000 VND from another. The fair result is not two payment requests: it is one net obligation of 8,000 VND from A to B.

Participants have a connected problem. They often receive only a number, a receipt image or a spreadsheet screenshot. They may not understand which items and adjustments produced that number, and then must open a separate banking app to type or confirm the payment information.

## 3. How users currently divide money

| Stage | Typical current method | Main weakness |
| --- | --- | --- |
| Capture | Paper receipt, photo or a message image. | The bill remains unstructured. |
| Identify consumption | Memory, notes or group chat. | Responses are scattered; shared dishes are hard to agree. |
| Calculate | Calculator, a note or spreadsheet formulas. | Manual re-entry and error-prone adjustment rules. |
| Explain | Screenshot, spreadsheet or chat message. | Participants may not understand their amount. |
| Request payment | Bank app, static QR or a QR generator. | Recipient/amount is separate from the bill calculation. |
| Confirm payment | Bank notifications, chat screenshots or a manual note. | Paid/unpaid status is disconnected from the bill. |

## 4. Existing-tool workaround and its limitation

A technically capable organiser can combine an open-source OCR tool such as PaddleOCR or Tesseract, Google Sheets/Excel, a VietQR generator, chat and a banking app:

```text
Receipt photo -> OCR output -> manual correction/copy into spreadsheet
-> formulas for items, shares, VAT/fees/discounts and net debts
-> copy final amount to VietQR -> send QR in chat
-> check bank app -> update sheet/payment status manually
```

This works, but it creates a chain of handoffs. The organiser must interpret OCR output, maintain formulas, detect reciprocal debts, retype the net amount into a QR generator and reconcile payment evidence across chat, spreadsheet and bank app. The participant cannot reliably tell which number is provisional versus final. The detailed analysis is in [Existing_Tools_Analysis.md](Existing_Tools_Analysis.md).

## 5. Competitor context and the MVP contrast

Direct competitors confirm that shared-expense tracking has demand:

| Competitor | Strong capability | Relevance to Splitly |
| --- | --- | --- |
| Splitwise | Groups, flexible splits, Pro receipt itemization and `simplify debts`. | Functional benchmark. It already reduces redundant payments, so Splitly cannot claim debt clearing as unique. |
| tricount | Collaborative tracking, custom amounts, payment requests and settlement suggestions. | Shows the appeal of free, simple group balance tracking. |
| Settle Up | Weighted splits, multiple people paid, reminders and minimized transfers. | Confirms the importance of complex settlement cases. |
| Spliit | Open-source/no-account model, beta AI scan and reimbursement optimization. | Shows that receipt scanning alone is not a durable differentiator. |

Splitwise officially describes `simplify debts` as restructuring debts within groups and friendships without changing each person's total balance while reducing payment count. This is a useful benchmark for Splitly's MVP debt-clearing capability: Splitly will calculate explainable cross-bill net payment instructions while preserving each confirmed bill, its participant obligations, and status.

The rationale for Splitly is to combine an explainable local receipt result, bill-level allocation, payment confirmation, and a VietQR request in one user journey. The detailed comparison is in [Competitor_Analysis.md](Competitor_Analysis.md).

## 6. Proposed value and market gap

> **Splitly helps Vietnamese groups turn a receipt into transparent bill-level obligations and ready-to-pay VietQR requests.**

The specific gap is the integrated path below, rather than any individual technical component:

```text
editable receipt data
  -> item and shared-dish assignment
  -> transparent VAT/service fee/discount allocation
  -> final personal balances
  -> per-person VietQR payment request for the confirmed bill
  -> paid/unpaid follow-up
```

This positioning is credible only if Splitly does three things better than a user's tool combination:

- makes OCR an editable draft rather than an unexplained financial answer;
- shows every participant why they owe the displayed amount; and
- provides a correct, locally convenient request for the confirmed bill-level obligation.

## 7. Business value and reason for choosing Splitly

| Value | Why it matters |
| --- | --- |
| Less payer coordination work | Receipt entry, bill allocation, payment status, debt clearing, and payment request are connected rather than copied between tools. |
| Greater trust | Transparent personal items, shared items and receipt adjustments reduce disputes. |
| Fewer transfers | Reciprocal amounts can be offset to a single net obligation. |
| Lower repayment friction | The final amount becomes a VietQR request instead of manually entered bank-transfer fields. |
| Clearer follow-up | Paid/unpaid state is linked to the original bill/debt rather than scattered across messages. |
| Focused local position | The product competes on Vietnamese receipt-to-payment convenience, not by cloning every global tracker feature. |

The solution was chosen because it uses already available building blocks - OCR, a calculation/debt engine and VietQR - but connects them in a way that reduces the user's manual coordination. It does not require Splitly to operate as a wallet or replace a banking app in order to provide value.

## 8. Proposal conclusion

Splitly should proceed to product and technical validation as a focused receipt-to-settlement experience for Vietnamese groups. The project is justified not by the absence of competitors, but by the burden of linking their alternatives manually: receipt extraction, spreadsheet logic, chat coordination, bill-level payment tracking, and bank payment exist separately today.

The proposal's differentiating promise is simple: after a user verifies a receipt and allocations, Splitly shows a transparent final balance, clears reciprocal debt where possible and produces a VietQR request for the amount actually left to pay.

## 9. Source register

1. [Splitwise Pro](https://www.splitwise.com/pro) and [Splitwise product page](https://secure.splitwise.com/) - receipt itemization, flexible split and balance features (accessed 16 July 2026).
2. [Splitwise debt simplification](https://feedback.splitwise.com/knowledgebase/articles/107220-what-is-debt-simplification) - debt restructuring and payment minimization (accessed 16 July 2026).
3. [tricount features](https://tricount.com/en-us/expense-tracker-features) and [tricount FAQs](https://help.tricount.com/articles/tricount-faqs) - shared-expense tracking and settlement (accessed 16 July 2026).
4. [Settle Up](https://settleup.io/) and [Settle Up store features](https://translate.settleup.io/projects/settle-up/stores/) - weighted split, multiple-payer, receipt-photo and transfer-minimization information (accessed 16 July 2026).
5. [Spliit](https://spliit.app/?lang=en) - beta AI scan, advanced split and reimbursement features (accessed 16 July 2026).
6. [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR), [Tesseract](https://github.com/tesseract-ocr/tesseract), [Google Sheets collaboration](https://support.google.com/a/users/answer/13309904?hl=en) and [VietQR.io API](https://vietqr.io/en/generate/) - building blocks for the existing-tool workaround (accessed 16 July 2026).
