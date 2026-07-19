# Splitly - Competitor Analysis

**Document type:** Business and competitor analysis  
**Version:** 2.0  
**Research cut-off:** 16 July 2026  
**Purpose:** Compare direct competitors against the bill-sharing decision criteria and identify the business rationale for Splitly.

## 1. Executive finding

Shared-expense software is an established category. Splitwise, tricount, Settle Up and Spliit already solve important parts of shared spending: recording expenses, sharing unequal amounts, tracking balances and reducing settlement transfers. Splitwise and Spliit also advertise receipt-scanning capabilities. Splitly should therefore not position itself as the first app that can split a bill, scan a receipt or clear a debt.

The opportunity is a **single Vietnam-oriented flow**: turn a receipt into editable bill data, assign personal and shared items, explain allocation of receipt adjustments, clear mutual debts where appropriate, and issue a payment-ready VietQR request for the final net amount. The reviewed competitor material does not advertise this full local flow. This is a testable market hypothesis, not a claim that competitors lack every individual capability.

## 2. Evidence convention

- **Y** - capability is clearly advertised in the cited evidence.
- **P** - a related capability is advertised, but not the exact end-to-end criterion.
- **U** - not confirmed in the reviewed first-party material; this is not proof that it does not exist.
- **N** - no Vietnam-specific/VietQR capability was found in the reviewed first-party material.

The Splitly column describes the proposed product behavior. It is not a claim that the product is already developed.

## 3. Capability comparison

| Decision criterion | Splitly | Splitwise | tricount | Settle Up | Spliit |
| --- | --- | --- | --- | --- | --- |
| Scan receipt | **Planned** - editable OCR bill draft | **Y** - Pro receipt scanning | **P** - attach receipt photo | **P** - Premium receipt photos; no OCR claim reviewed | **Y** - beta AI scan |
| Assign a receipt item to a person | **Planned** - by-item split | **Y** - Pro itemization assigns detected items to friends | **P** - custom expense allocation, not line-item assignment evidenced | **P** - manual "expense from bill" item entry; assignment not evidenced | **P** - advanced expense split; item assignment not evidenced |
| Split a shared item | **Planned** - equal or item-based allocation | **P** - item assignment plus custom split settings; exact per-line shared rule not detailed | **P** - parts or custom amounts at expense level | **P** - weighted expense splits; exact receipt-line rule not evidenced | **P** - percentage, shares or amounts at expense level |
| Allocate VAT, service fee and discount transparently | **Planned** - explicit adjustment rule and reconciliation | **U** | **U** | **U** | **U** |
| Multiple people pay upfront | **Planned decision** - assess whether multi-payer receipts belong in the first release | **Y** - web supports `2+ people paid` | **U** | **Y** - advertises multiple people paid | **U** |
| Optimize or clear final debts | **Planned** - transparent cross-bill netting and payment instructions | **Y** - `simplify debts` restructures debts and minimizes payments | **Y** - settlement suggestions limit transactions | **Y** - explicitly minimizes transfers | **Y** - reimbursement optimization |
| VietQR request for the final amount | **Planned** - final balance becomes a VietQR request | **N** - generic payment integrations are advertised, not VietQR | **N** - payment requests, no VietQR evidence | **N** - no VietQR evidence | **N** - no VietQR evidence |
| Track paid / unpaid and remind | **Planned** - bill-linked payment status and reminders | **Y** - payments can be recorded | **Y** - payment requests and balances | **Y** - debt can be marked settled and reminders are evidenced | **P** - reimbursements are advertised; reminder/status detail not evidenced |

## 4. Debt simplification benchmark

Debt clearing can remove redundant transfers after several shared bills and is part of the approved Splitly MVP workflow. The planned capability calculates transparent net obligations and payment instructions; it does not initiate transfers or independently confirm them.

| Aspect | Splitly | Splitwise |
| --- | --- | --- |
| MVP position | Splitly calculates cross-bill net payment instructions from outstanding obligations while retaining the underlying bill records. | `Simplify debts` restructures group and friendship debts to minimize the total number of payments without changing each person's total balance. |
| Mutual-debt example | The MVP offsets A owing B 10,000 VND against B owing A 2,000 VND and shows one 8,000 VND instruction from A to B, with both source obligations visible. | Splitwise can simplify reciprocal balances and longer group chains into fewer payments. |
| Business implication | The MVP focuses on accurate receipt entry, explainable allocation, clearing instructions, confirmation, reminders, and VietQR for the resulting net amount. | Splitwise remains a benchmark for debt-simplification behavior. |

The MVP commits to a deterministic cross-bill clearing algorithm. Its requirements include conservation of net balances, explanation of included obligations and generated instructions, authorization over all included data, and tests for reciprocal and multi-party debts.

Splitwise's official help describes `simplify debts` as restructuring debts within groups and across friendships, preserving each person's total while reducing payment count. [Splitwise debt simplification](https://feedback.splitwise.com/knowledgebase/articles/107220-what-is-debt-simplification)

**Positioning consequence:** Cross-bill debt clearing is a current, planned MVP capability. The initial product should differentiate through an explainable receipt-to-bill workflow, transparent clearing instructions, bill-level payment status, and a local VietQR request, without claiming to transfer or independently verify payments.

## 5. Competitor assessment

### 5.1 Splitwise

#### Strengths

- Mature shared ledger with groups, unequal/percentage/share splits and balance tracking.
- Pro advertises receipt scanning, detected receipt items and assignment of items to friends.
- Officially supports debt simplification and records payments.

#### Limitations for Splitly's target situation

- Receipt scanning/itemization is presented as a Pro benefit.
- The reviewed material does not present a Vietnamese-receipt correction flow or a VietQR payment request.
- Its generic global workflow is the benchmark to exceed in local convenience, not a weak alternative to dismiss.

**Implication:** Splitly must offer a visibly faster receipt-to-final-payment journey for Vietnamese groups; generic balance tracking is insufficient differentiation.

### 5.2 tricount

#### Strengths

- Free collaborative tracking with unequal amounts, parts, payment requests, offline support and multi-currency travel features.
- Settlement suggestions reduce the number of repayment transfers.

#### Limitations for Splitly's target situation

- Current materials promote manual entry and receipt-photo attachment, not OCR itemization.
- No VietQR-specific payment flow was found in the reviewed official pages.

**Implication:** Do not compete on broad trip tracking. Focus on reducing transcription and payment handoff after an itemized Vietnamese receipt.

### 5.3 Settle Up

#### Strengths

- Supports even/weighted splits, multiple people who paid, reminders and minimized transfers.
- Supports a manual "expense from bill" concept and receipt photos.

#### Limitations for Splitly's target situation

- Receipt photos are listed as Premium; OCR extraction was not established by the reviewed material.
- The reviewed material does not establish transparent allocation of VAT, service charge and discount at receipt-item level.
- No VietQR-specific request is advertised.

**Implication:** Multiple-upfront-payer bills are a legitimate requirement that Splitly should decide explicitly, not ignore.

### 5.4 Spliit

#### Strengths

- Open source, no account, no ads and no limits reduce adoption friction.
- Advertises beta AI receipt scan, receipt attachments, advanced expense-level splits and reimbursement optimization.

#### Limitations for Splitly's target situation

- The published material does not establish Vietnamese receipt quality, per-line participant assignment or a receipt-adjustment explanation.
- No VietQR request is advertised.

**Implication:** Generic AI scan is copyable. The durable value is trustworthy correction, transparent allocation and a payment-ready local settlement.

## 6. Market gap and rationale for Splitly

The research indicates that a user can find individual components, but not an advertised end-to-end Vietnam-specific experience for the following chain:

```text
Receipt image
  -> editable bill data
  -> item and shared-dish assignment
  -> transparent VAT/service fee/discount allocation
  -> confirmed bill-level obligations
  -> per-person VietQR request
  -> paid/unpaid follow-up
```

The result is a focused position rather than a broad claim:

> **Splitly helps Vietnamese groups turn a receipt into transparent bill-level obligations and ready-to-pay VietQR requests.**

This integrated flow is valuable because it joins calculation correctness, social transparency and payment completion. It also makes existing debt-clearing behavior more useful: the user sees a single remaining amount after offsetting mutual obligations and can pay that amount without re-entering it in a bank app.

## 7. Sources

### External sources

1. [Splitwise Pro](https://www.splitwise.com/pro) - receipt scan and detected-item assignment (accessed 16 July 2026).
2. [Splitwise product page](https://secure.splitwise.com/) - flexible splits, balances and payment integrations (accessed 16 July 2026).
3. [Splitwise debt simplification](https://feedback.splitwise.com/knowledgebase/articles/107220-what-is-debt-simplification) - group/friendship debt restructuring and payment reduction (accessed 16 July 2026).
4. [tricount features](https://tricount.com/en-us/expense-tracker-features) and [tricount FAQs](https://help.tricount.com/articles/tricount-faqs) - collaboration, custom amounts, receipt-photo attachment and settlement (accessed 16 July 2026).
5. [Settle Up](https://settleup.io/) and [Settle Up store features](https://translate.settleup.io/projects/settle-up/stores/) - multiple people paid, receipt photos, reminders and minimized transfers (accessed 16 July 2026).
6. [Spliit features](https://spliit.app/?lang=en) - beta AI scan, receipt images, advanced splits and reimbursements (accessed 16 July 2026).
7. [VietQR.io generate API](https://vietqr.io/en/generate/) - QR fields for recipient, amount and transfer information (accessed 16 July 2026).
