import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, Mail, Phone, MapPin, Clock, MessageSquare, User, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";

const contactInfo = [
  {
    icon: Mail,
    title: "Email Us",
    value: "vishwas.vashishta@mca.christuniversity.in",
    description: "We'll respond within 24 hours",
  },
  {
    icon: Phone,
    title: "Call Us",
    value: "+91 7060200434",
    description: "Mon-Fri, 9am-6pm IST",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    value: "Christ University",
    description: " Central Campus, Hosur Road, Bengaluru, Karnataka",
  },
  {
    icon: Clock,
    title: "Working Hours",
    value: "Mon - Sat",
    description: "9:00 AM - 6:00 PM IST",
  },
];

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success("Message sent successfully! We'll get back to you soon.");
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <Logo />
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 py-12 md:py-16 px-4 md:px-6">
        <div className="container max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16 animate-fade-up">
            <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/10 mb-4">
              <MessageSquare className="w-7 h-7 md:w-8 md:h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Get in Touch
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              Have questions, feedback, or just want to say hello? We'd love to hear from you. Fill out the form below and we'll get back to you as soon as possible.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 md:gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              <div className="animate-fade-up">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 md:mb-6">
                  Contact Information
                </h2>
                <p className="text-muted-foreground mb-6 md:mb-8 text-sm md:text-base">
                  Reach out through any of these channels and we'll respond promptly.
                </p>
              </div>

              <div className="space-y-3 md:space-y-4">
                {contactInfo.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-all duration-300 animate-fade-up group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:scale-110 transition-all">
                      <item.icon className="w-5 h-5 md:w-6 md:h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{item.title}</p>
                      <p className="font-semibold text-foreground">{item.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3 animate-fade-up stagger-1">
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-6">
                  Send us a Message
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="text"
                          name="name"
                          placeholder="Vishwas Vashishtha"
                          value={formData.name}
                          onChange={handleChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="email"
                          name="email"
                          placeholder="vishwas.vashishta@mca.christuniversity.in"
                          value={formData.email}
                          onChange={handleChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="tel"
                          name="phone"
                          placeholder="+91 7060200434"
                          value={formData.phone}
                          onChange={handleChange}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Subject *</label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <select
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          className="w-full h-10 pl-10 pr-4 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          required
                        >
                          <option value="">Select a subject</option>
                          <option value="general">General Inquiry</option>
                          <option value="support">Technical Support</option>
                          <option value="feedback">Feedback</option>
                          <option value="partnership">Partnership</option>
                          <option value="advertising">Advertising</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Message *</label>
                    <textarea
                      name="message"
                      placeholder="Tell us how we can help you..."
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                      required
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full gap-2" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
