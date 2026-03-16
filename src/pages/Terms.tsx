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
    content: "If you have any questions about these Terms of Service, please contact us at legal@unieasy.com. We aim to respond to all inquiries within 48 business hours."
  }
];

const Terms = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-16 md:pt-20 pb-16 px-6">
        <div className="container max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Please read these terms carefully before using UniEasy. By using our platform, you agree to these terms.
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
                    {section.content && (
                      <p className="text-muted-foreground leading-relaxed">
                        {section.content}
                      </p>
                    )}
                    {section.items && (
                      <ul className="space-y-2 mt-2">
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

          {/* Agreement Notice */}
          <div className="mt-12 p-6 bg-primary/5 rounded-2xl border border-primary/20 text-center">
            <p className="text-muted-foreground">
              By continuing to use UniEasy, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
