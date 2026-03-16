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
    content: "If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at unieasy.app@gmail.com."
  }
];

const Privacy = () => {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-background flex flex-col">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="home-grid-overlay" />
        <div className="home-aurora home-aurora-one left-auto right-0 md:right-[-4rem] opacity-60" />
        <div className="home-aurora home-aurora-three" />
      </div>

      <Header />

      <main className="relative z-10 flex-1 pt-16 md:pt-20 pb-16 px-4 md:px-6">
        <div className="container max-w-7xl mx-auto px-0">
          {/* Header */}
          <div className="mb-8 md:mb-10">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-primary/10">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">
                  Privacy Policy
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Last updated: January 19, 2026
                </p>
              </div>
            </div>
            <p className="mt-4 text-muted-foreground text-sm md:text-base leading-relaxed max-w-3xl">
              Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
            </p>
          </div>
          
          {/* Sections */}
          <div className="space-y-5 md:space-y-6">
            {sections.map((section, index) => (
              <div 
                key={index}
                className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-border/80 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <section.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg md:text-xl font-semibold tracking-tight text-foreground mb-2">
                      {index + 1}. {section.title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                      {section.content}
                    </p>
                    {section.items && (
                      <ul className="space-y-2 mt-3">
                        {section.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-muted-foreground text-sm md:text-base">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
