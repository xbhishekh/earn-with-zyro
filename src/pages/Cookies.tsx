import { LegalDoc } from "@/components/legal/LegalDoc";

const cookiesContent = `
# Cookie Policy

**Last Updated: September 4, 2026**

This Cookie Policy explains how Cliperus uses cookies and similar technologies when you visit our platform.

## 1. What Are Cookies

Cookies are small text files stored on your device that help websites remember your preferences, keep you signed in, and understand how the platform is used.

## 2. Cookies We Use

**Essential cookies (always on)**

- Authentication session tokens that keep you securely logged in
- Security cookies that protect against cross-site request forgery
- Load-balancing cookies required for the platform to function

**Preference cookies**

- Theme selection (light/dark mode)
- Language and display settings
- Recently viewed campaigns

**Analytics cookies**

- Anonymous usage statistics that help us improve features
- Campaign performance measurement (view verification)
- We do not sell analytics data to third parties

## 3. What We Never Do

- We never use cookies to track you across unrelated websites
- We never sell cookie data to advertisers
- We never store payment card details in cookies

## 4. Managing Cookies

You can control or delete cookies through your browser settings at any time:

- **Chrome:** Settings → Privacy and Security → Cookies
- **Safari:** Preferences → Privacy
- **Firefox:** Settings → Privacy & Security
- **Edge:** Settings → Cookies and Site Permissions

Blocking essential cookies will prevent you from logging in and using core features.

## 5. Third-Party Cookies

Payment processing and video embeds from integrated platforms (such as TikTok or YouTube embeds on campaign pages) may set their own cookies governed by their respective policies.

## 6. Updates

We may update this policy as our platform evolves. Material changes will be announced on this page with an updated date.

## 7. Contact

Questions about cookies? Email **privacy@cliperus.com**.
`;

const Cookies = () => (
  <LegalDoc
    title="Cookie Policy"
    description="Cliperus Cookie Policy - How we use essential, preference, and analytics cookies, and how you can control them."
    canonical="/cookies"
    pageType="cookies"
    defaultContent={cookiesContent}
  />
);

export default Cookies;
