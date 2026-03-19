import {
  Shield,
  Eye,
  Lock,
  Database,
  Cookie,
  Globe,
  UserCheck,
  Mail,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const sections = [
  {
    icon: Shield,
    title: "Who This Policy Applies To",
    content:
      "This Privacy Policy applies to anyone using UniEasy, including students, merchants, admins, superadmins, and visitors. It explains how data is collected, used, protected, and governed across campus discovery, community interactions, and merchant promotion workflows.",
  },
  {
    icon: Database,
    title: "Data We Collect in UniEasy",
    content:
      "We collect the minimum data needed to operate campus discovery, account security, and moderation features. Depending on how you use UniEasy, this may include:",
    items: [
      "Account identity from sign-in providers and profile details you choose to add",
      "Campus-related preferences used for personalized listings and recommendations",
      "User-generated content such as reviews, ratings, reactions, and form submissions",
      "Merchant-provided ad and listing content, including uploaded images",
      "Operational metadata such as request logs, error events, and anti-abuse signals",
    ],
  },
  {
    icon: Eye,
    title: "How We Use Data",
    content:
      "We use your information to run the platform safely and deliver core features:",
    items: [
      "Authenticate users and maintain role-based access controls",
      "Show relevant food, accommodation, study, and essentials content",
      "Process and display community reviews and merchant promotions",
      "Investigate abuse, policy violations, and suspicious activity",
      "Improve reliability, performance, and product quality",
    ],
  },
  {
    icon: Lock,
    title: "Data Sharing and Access",
    content:
      "We do not sell personal data. Access is restricted by technical controls and shared only when needed to provide service or comply with law:",
    items: [
      "Infrastructure and service providers that host or secure UniEasy",
      "Other users, only for content intended to be public (for example reviews)",
      "Authorized admins/superadmins for moderation, abuse handling, and audit functions",
      "Authorities or regulators where disclosure is legally required",
    ],
  },
  {
    icon: Cookie,
    title: "Cookies, Sessions, and Similar Technologies",
    content:
      "We use cookies or equivalent browser storage to keep sessions active, remember preferences, and support security features. Disabling these controls may affect login state, personalization, and parts of the app experience.",
  },
  {
    icon: UserCheck,
    title: "Security and Abuse Prevention",
    content:
      "We apply layered protections such as authentication checks, role-based permissions, request controls, and monitoring to reduce unauthorized access and abuse. No system is perfectly secure, but we continuously improve safeguards as risks evolve.",
  },
  {
    icon: UserCheck,
    title: "Your Rights and Controls",
    content:
      "You can request actions on your account data, subject to legal and security constraints:",
    items: [
      "Access and correct profile information",
      "Request deletion or export of data associated with your account",
      "Control what content you choose to submit publicly",
      "Contact us to challenge or clarify moderation-related decisions",
    ],
  },
  {
    icon: Globe,
    title: "Data Retention, Transfers, and Policy Updates",
    content:
      "We retain data only as long as necessary for platform operations, compliance, dispute handling, and fraud prevention. Depending on infrastructure location, data may be processed in regions outside your home jurisdiction with appropriate contractual and technical safeguards. We may update this policy when product features, legal obligations, or security practices change. Material updates will be posted on this page with a revised date.",
  },
  {
    icon: Mail,
    title: "Contact Information",
    content:
      "If you have questions, privacy requests, or concerns about data handling on UniEasy, contact us at send2vav@gmail.com.",
  },
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
                  Last updated: March 19, 2026
                </p>
              </div>
            </div>
            <p className="mt-4 text-muted-foreground text-sm md:text-base leading-relaxed max-w-3xl">
              This policy explains how UniEasy collects, uses, protects, and
              governs data across student features, community content, and
              merchant workflows.
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

export default Privacy;
