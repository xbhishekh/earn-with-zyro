import { LegalDoc } from "@/components/legal/LegalDoc";

const securityContent = `
# Security

**Last Updated: September 4, 2026**

The security of your account, earnings, and data is fundamental to Cliperus. This page explains how we protect the platform and how you can help.

## 1. How We Protect Your Data

- **Encryption in transit** — all traffic between your device and Cliperus is encrypted with TLS 1.2+
- **Encryption at rest** — databases and file storage are encrypted by our infrastructure providers
- **Row-level security** — database access is enforced per-user at the data layer, so accounts can only ever read their own records
- **Hashed credentials** — passwords are never stored in plain text and are handled exclusively by our authentication provider

## 2. Payment Security

- Payouts are processed through licensed, PCI-DSS compliant payment partners
- Cliperus never stores full bank or card numbers on our servers
- Withdrawals require account verification and are screened for fraud before release

## 3. Platform Integrity

- View verification systems detect bot traffic, view manipulation, and fraudulent engagement
- Automated and human review of submissions protects campaign budgets
- Role-based access controls limit what team members and admins can access

## 4. Your Responsibilities

- Use a strong, unique password and never share it
- Enable any available two-factor authentication options
- Log out on shared devices
- Beware of phishing — Cliperus will never ask for your password by email or DM

## 5. Reporting a Vulnerability

We welcome responsible disclosure from security researchers:

1. Email **security@cliperus.com** with a detailed description
2. Do not access, modify, or delete data belonging to other users
3. Do not publicly disclose the issue until we have resolved it
4. We acknowledge reports within **72 hours** and aim to resolve critical issues within **7 days**

## 6. Incident Response

If a security incident affects your data, we will notify affected users by email without undue delay, explain what happened, and describe the steps we are taking.

## 7. Contact

Security concerns or questions: **security@cliperus.com**
`;

const Security = () => (
  <LegalDoc
    title="Security"
    description="Cliperus Security - How we protect your account, earnings, and data, and how to report vulnerabilities responsibly."
    canonical="/security"
    pageType="security"
    defaultContent={securityContent}
  />
);

export default Security;
