import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

const termsContent = `
# Terms of Service

**Last Updated: January 15, 2026**

Welcome to Zyrozo! These Terms of Service ("Terms") govern your use of the Zyrozo platform and services.

## 1. Acceptance of Terms

By accessing or using Zyrozo, you agree to be bound by these Terms. If you do not agree, please do not use our services.

## 2. Eligibility

You must be at least 18 years old to use Zyrozo. By using our platform, you represent that you meet this requirement.

## 3. Account Registration

- You must provide accurate and complete information when creating an account
- You are responsible for maintaining the security of your account
- You must notify us immediately of any unauthorized access

## 4. Creator Responsibilities

- All content must comply with applicable laws and our Community Guidelines
- You must own or have rights to all content you submit
- You may not engage in fraudulent activities (fake views, bot traffic, etc.)
- You are responsible for paying applicable taxes on your earnings

## 5. Campaign Participation

- Each campaign has specific guidelines that must be followed
- Submissions are subject to review and approval
- Rejected submissions may be appealed once
- Earnings are calculated based on verified views

## 6. Payments

- Minimum withdrawal amount is $10
- Payments are processed within 7 business days
- We reserve the right to withhold payments for suspected fraud
- All earnings are subject to platform fees as disclosed

## 7. Intellectual Property

- You retain ownership of your original content
- By submitting content, you grant brands license to use it per campaign terms
- Zyrozo branding and technology remain our property

## 8. Prohibited Activities

- Spam, harassment, or abusive behavior
- Manipulation of views or engagement metrics
- Multiple accounts per person
- Sharing account credentials

## 9. Termination

We may suspend or terminate accounts that violate these Terms or engage in activities that harm the platform or community.

## 10. Disclaimers

Zyrozo is provided "as is" without warranties. We do not guarantee earnings or campaign availability.

## 11. Limitation of Liability

Our liability is limited to the amount paid to you in the past 12 months, not exceeding $1,000.

## 12. Changes to Terms

We may update these Terms at any time. Continued use after changes constitutes acceptance.

## 13. Contact

For questions about these Terms, contact us at legal@zyrozo.com
`;

const Terms = () => {
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
                {termsContent.split('\n').map((line, index) => {
                  if (line.startsWith('# ')) {
                    return (
                      <h1 key={index} className="font-display text-3xl font-bold gradient-text mb-2">
                        {line.replace('# ', '')}
                      </h1>
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

export default Terms;
