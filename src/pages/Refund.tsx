import { LegalDoc } from "@/components/legal/LegalDoc";

const refundContent = `
# Refund Policy

**Last Updated: September 4, 2026**

At Cliperus, we want every creator and business to have a fair and transparent experience. This Refund Policy explains when refunds apply and how to request one.

## 1. General Principle

Cliperus is free to join for creators — there is no sign-up fee, subscription fee, or application fee. Because creators never pay to use the core platform, creator accounts are not eligible for refunds simply because there is nothing to refund.

## 2. Marketplace Purchases

Digital products, courses, communities, and services sold through the Cliperus Marketplace are subject to the following rules:

- You may request a full refund within **14 days** of purchase if you have not accessed, downloaded, or consumed more than 20% of the product
- Products marked "non-refundable" at checkout are final sale
- Memberships and paid communities may be cancelled anytime; access continues until the end of the current billing period and no partial refunds are issued for unused time
- Refund requests for services already delivered (coaching calls completed, custom work delivered) are reviewed case-by-case

## 3. Campaign Budgets (Businesses)

- Unused campaign budget that has not been allocated to verified views may be refunded in full upon written request
- Amounts already earned by creators for verified, approved views are **non-refundable**
- If a campaign is cancelled by Cliperus for policy reasons, all unspent funds are returned automatically within 10 business days

## 4. Creator Earnings

- Earnings paid out for verified views are final and cannot be reversed
- If an overpayment or calculation error occurs, we will notify you and correct it against future earnings or request repayment
- Earnings from fraudulent activity (bot views, engagement manipulation) are voided and are not subject to this policy

## 5. How to Request a Refund

1. Email **billing@cliperus.com** from your registered email address
2. Include your order ID or campaign ID and the reason for the request
3. Our team reviews every request within **3 business days**
4. Approved refunds are issued to the original payment method within **5–10 business days**

## 6. Chargebacks

Filing a chargeback without first contacting us may result in account suspension while we investigate. We encourage you to reach out first — most issues are resolved within 48 hours.

## 7. Contact

Questions about this policy? Email **billing@cliperus.com** or visit our Help & Support page.
`;

const Refund = () => (
  <LegalDoc
    title="Refund Policy"
    description="Cliperus Refund Policy - Learn how refunds work for marketplace purchases, campaign budgets, and creator earnings."
    canonical="/refund"
    pageType="refund"
    defaultContent={refundContent}
  />
);

export default Refund;
