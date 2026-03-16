import { Shield, Eye, Lock, Database, Bell, Cookie, Globe, UserCheck, Mail } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const sections = [
  {
    icon: Database,
    title: "Information We Collect",
    content: "We collect information you provide directly to us when you create an account, submit reviews, or contact support. This includes:",
    items: [
      "Account information: name, email address, phone number",
      "University and course details for personalization",
      "Reviews, ratings, and photos you submit",
      "Device information and usage analytics",
      "Communications with our support team"
    ]
  },
  {
    icon: Eye,
    title: "How We Use Your Information",
    content: "Your information helps us provide and improve our services:",
    items: [
      "Deliver and personalize your UniEasy experience",
      "Send important updates, notifications, and recommendations",
      "Analyze usage patterns to improve our platform",
      "Respond to your inquiries and provide customer support",
      "Detect, prevent, and address fraud or security issues"
    ]
  },
  {
    icon: Lock,
    title: "Information Sharing & Security",
    content: "We do not sell your personal information to third parties. We may share your data only with:",
    items: [
      "Service providers who help operate our platform",
      "Law enforcement when required by applicable law",
      "Other users (only your public profile and reviews)",
      "Business partners with your explicit consent"
    ]
  },
  {
    icon: Cookie,
    title: "Cookies & Tracking",
    content: "We use cookies and similar technologies to enhance your experience, remember your preferences, and analyze how our platform is used. You can control cookie settings through your browser, though some features may not function properly if cookies are disabled."
  },
  {
    icon: UserCheck,
    title: "Your Rights & Choices",
    content: "You have control over your personal information:",
    items: [
      "Access and download your personal data",
      "Correct inaccurate or incomplete information",
      "Delete your account and associated data",
      "Opt out of marketing communications",
      "Request data portability"
    ]
  },
  {
    icon: Bell,
    title: "Updates to This Policy",
    content: "We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by posting the new policy on this page with an updated effective date."
  },
  {
    icon: Globe,
    title: "Data Retention & Transfer",
    content: "We retain your personal information for as long as necessary to provide our services and fulfill the purposes described in this policy. Your data may be transferred to and processed in countries other than your own, where data protection laws may differ."
  },
  {
    icon: Mail,
    title: "Contact Us",
    content: "If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact our Data Protection Officer at privacy@unieasy.com. We aim to respond to all inquiries within 30 days."
  }
];

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-16 md:pt-20 pb-16 px-6">
        <div className="container max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: January 19, 2026
            </p>
          </div>
          
          {/* Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <div 
                key={index}
                className="bg-card rounded-2xl p-8 border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <section.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground mb-3">
                      {index + 1}. {section.title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {section.content}
                    </p>
                    {section.items && (
                      <ul className="space-y-2 mt-3">
                        {section.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Badge */}
          <div className="mt-12 p-6 bg-primary/5 rounded-2xl border border-primary/20 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lock className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Your Data is Safe With Us</span>
            </div>
            <p className="text-muted-foreground text-sm">
              We use industry-standard encryption and security measures to protect your personal information.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
