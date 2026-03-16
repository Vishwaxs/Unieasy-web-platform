import { Shield, FileText, Users, AlertTriangle, Scale, Mail } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const sections = [
  {
    icon: Shield,
    title: "Acceptance of Terms",
    content: "By accessing and using UniEasy, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this platform. These terms apply to all visitors, users, and others who access or use the service."
  },
  {
    icon: FileText,
    title: "Description of Service",
    content: "UniEasy is a comprehensive platform designed specifically for university students to discover food spots, accommodation options, study zones, and other essential services around their campus. We aggregate and present information, reviews, and ratings to help you make informed decisions about places near your university."
  },
  {
    icon: Users,
    title: "User Accounts & Responsibilities",
    content: "To access certain features, you must create an account with accurate, complete information. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account or any other breach of security."
  },
  {
    icon: AlertTriangle,
    title: "Prohibited Conduct",
    items: [
      "Posting false, misleading, or defamatory information",
      "Harassing, threatening, or abusing other users",
      "Violating any applicable laws, regulations, or third-party rights",
      "Attempting to gain unauthorized access to our systems or networks",
      "Using the platform for commercial purposes without prior written consent",
      "Uploading malicious code, viruses, or harmful content"
    ]
  },
  {
    icon: Scale,
    title: "Disclaimer & Limitation of Liability",
    content: "UniEasy provides information 'as is' without warranties of any kind, either express or implied. We do not guarantee the accuracy, completeness, reliability, or availability of any listings, reviews, or content. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform."
  },
  {
    icon: Mail,
    title: "Contact Information",
    content: "If you have any questions about these Terms of Service, please contact us at unieasy.app@gmail.com."
  }
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
                  Terms of Service
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Last updated: January 19, 2026
                </p>
              </div>
            </div>
            <p className="mt-4 text-muted-foreground text-sm md:text-base leading-relaxed max-w-3xl">
              Please read these terms carefully before using UniEasy. By using our platform, you agree to these terms.
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

export default Terms;
