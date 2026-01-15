import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

const privacyContent = `
# Privacy Policy

**Last Updated: January 15, 2026**

At Zyrozo, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information.

## 1. Information We Collect

### Personal Information
- Name, email address, and phone number
- Payment details and payout information
- Social media account usernames and profile URLs
- Profile photo and bio

### Usage Information
- IP address and device information
- Pages visited and features used
- Campaign participation and submission data
- Earnings and transaction history

### Content
- Videos, images, and other content you submit
- Comments and chat messages

## 2. How We Use Your Information

- To operate and improve our platform
- To process payments and track earnings
- To communicate about campaigns and updates
- To prevent fraud and enforce our Terms
- To personalize your experience
- To comply with legal obligations

## 3. Information Sharing

We share your information with:
- **Brands**: Campaign-related information for approved submissions
- **Payment Processors**: To process your withdrawals
- **Service Providers**: Analytics, hosting, and support services
- **Legal Authorities**: When required by law

We never sell your personal information to third parties.

## 4. Data Security

We implement industry-standard security measures:
- Encryption of sensitive data in transit and at rest
- Regular security audits and updates
- Limited access controls for employees
- Secure payment processing (PCI compliant)

## 5. Your Rights

You have the right to:
- Access your personal data
- Correct inaccurate information
- Request deletion of your data
- Export your data in a portable format
- Opt out of marketing communications

## 6. Cookies and Tracking

We use cookies and similar technologies to:
- Maintain your session and preferences
- Analyze platform usage
- Improve user experience

You can control cookies through your browser settings.

## 7. Data Retention

We retain your data as long as your account is active. After account deletion, we may retain certain data for legal and business purposes for up to 5 years.

## 8. Children's Privacy

Zyrozo is not intended for users under 18. We do not knowingly collect data from minors.

## 9. International Transfers

Your data may be transferred to and processed in countries outside India. We ensure appropriate safeguards are in place.

## 10. Changes to This Policy

We may update this Privacy Policy periodically. We will notify you of significant changes via email or platform notification.

## 11. Contact Us

For privacy-related questions or requests:
- Email: privacy@zyrozo.com
- Address: 123 Creator Hub, Mumbai, Maharashtra 400001

## 12. Grievance Officer

As per Information Technology Act, 2000:
- Name: [Grievance Officer Name]
- Email: grievance@zyrozo.com
`;

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className="glass-card rounded-2xl p-8 md:p-12">
              <div className="prose prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground max-w-none">
                {privacyContent.split('\n').map((line, index) => {
                  if (line.startsWith('# ')) {
                    return (
                      <h1 key={index} className="font-display text-3xl font-bold gradient-text mb-2">
                        {line.replace('# ', '')}
                      </h1>
                    );
                  }
                  if (line.startsWith('### ')) {
                    return (
                      <h3 key={index} className="font-display text-lg font-semibold mt-4 mb-2 text-primary">
                        {line.replace('### ', '')}
                      </h3>
                    );
                  }
                  if (line.startsWith('## ')) {
                    return (
                      <h2 key={index} className="font-display text-xl font-bold mt-8 mb-4">
                        {line.replace('## ', '')}
                      </h2>
                    );
                  }
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <p key={index} className="text-sm text-muted-foreground mb-6">
                        {line.replace(/\*\*/g, '')}
                      </p>
                    );
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <li key={index} className="ml-4">
                        {line.replace('- ', '')}
                      </li>
                    );
                  }
                  if (line.trim()) {
                    return <p key={index} className="mb-4">{line}</p>;
                  }
                  return null;
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
