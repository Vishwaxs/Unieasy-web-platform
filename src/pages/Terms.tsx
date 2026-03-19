import {
  Shield,
  FileText,
  Users,
  AlertTriangle,
  Scale,
  Mail,
  Store,
  Star,
  Lock,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const sections = [
  {
    icon: Shield,
    title: "Who These Terms Apply To",
    content:
      "These Terms apply to anyone using UniEasy, including students, merchants, admins, and visitors. UniEasy is a campus-focused discovery platform for food, accommodation, study spots, and essential nearby services. By using the platform, you agree to follow these Terms, our Privacy Policy, and all applicable laws.",
  },
  {
    icon: Users,
    title: "Accounts, Roles, and Access",
    content:
      "To use protected features, you must sign in with accurate information. You are responsible for activities under your account and for keeping your login secure. UniEasy uses role-based access (such as student, merchant, admin, and superadmin), and attempting to bypass role permissions is prohibited.",
    items: [
      "Keep your profile details current and truthful",
      "Do not share, sell, or transfer your account",
      "Report unauthorized access immediately",
    ],
  },
  {
    icon: Star,
    title: "Reviews, Ratings, and Community Content",
    content:
      "Reviews, ratings, reactions, and similar contributions must be based on real experiences and must not be misleading. Content you post should be respectful, relevant, and lawful.",
    items: [
      "No fake reviews, paid manipulation, or review spam",
      "No harassment, hate speech, threats, or personal attacks",
      "No posting private or sensitive information about others",
      "No copied content that infringes third-party rights",
    ],
  },
  {
    icon: Store,
    title: "Merchant Ads and Listings",
    content:
      "Merchants can create promotional ads and listings only through approved UniEasy workflows. Merchant content must be accurate, lawful, and supported by rights to text and images used.",
    items: [
      "Ad submissions may be reviewed, approved, rejected, or removed",
      "Misleading claims, prohibited goods/services, and impersonation are not allowed",
      "Merchants are responsible for pricing, availability, and offer fulfillment",
      "Repeated violations can result in suspension or permanent removal of merchant access",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Platform Safety and Prohibited Conduct",
    items: [
      "Attempting to access accounts, APIs, or data without permission",
      "Using bots, scraping tools, or automation that degrades service performance",
      "Uploading malware, harmful code, or security exploits",
      "Circumventing moderation, rate limits, or access controls",
      "Using UniEasy for illegal activity or fraud",
    ],
  },
  {
    icon: Lock,
    title: "Moderation and Enforcement",
    content:
      "To keep UniEasy useful and safe, we may investigate reports and take action on accounts, ads, reviews, or other content that violate these Terms. Actions can include warnings, content removal, role downgrade, temporary suspension, or permanent ban.",
  },
  {
    icon: Scale,
    title: "Service Disclaimer and Liability Limits",
    content:
      "UniEasy provides discovery information and community-generated content on an 'as available' basis. While we work to keep information useful and up to date, we cannot guarantee completeness, accuracy, uninterrupted access, or outcomes from third-party merchants and places. To the extent allowed by law, UniEasy is not liable for indirect or consequential losses arising from platform use.",
  },
  {
    icon: FileText,
    title: "Changes to Terms",
    content:
      "We may update these Terms when features, policies, or legal requirements change. Material updates will be posted on this page with a revised date. Continued use of UniEasy after changes means you accept the updated Terms.",
  },
  {
    icon: Mail,
    title: "Contact Information",
    content:
      "Questions about these Terms, moderation actions, or merchant compliance can be sent to unieasy.app@gmail.com.",
  },
];

const Terms = () => {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-background flex flex-col">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="home-grid-overlay" />
        <div className="home-aurora home-aurora-one left-auto right-0 md:right-[-4rem] opacity-60" />
        <div className="home-aurora home-aurora-two" />
      </div>

      <Header />

      <main className="relative z-10 flex-1 pt-16 md:pt-20 pb-16 px-4 md:px-6">
        <div className="container max-w-7xl mx-auto px-0">
          {/* Header */}
          <div className="mb-8 md:mb-10">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">
                  Terms and Conditions
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Last updated: March 19, 2026
                </p>
              </div>
            </div>
            <p className="mt-4 text-muted-foreground text-sm md:text-base leading-relaxed max-w-3xl">
              These terms are tailored to how UniEasy operates: campus
              discovery, student-generated reviews, and moderated merchant
              promotions.
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
                    {section.content && (
                      <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                        {section.content}
                      </p>
                    )}
                    {section.items && (
                      <ul className="space-y-2 mt-3">
                        {section.items.map((item, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-muted-foreground text-sm md:text-base"
                          >
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

export default Terms;
