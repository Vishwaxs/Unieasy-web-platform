import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Github, Linkedin, Twitter } from "lucide-react";
import { toast } from "sonner";

import Logo from "@/components/Logo";
import christLogoHref from "@/assets/Christ-logo.png";

const developers = [
  { name: "Vishwas Vashishtha", role: "Full Stack Developer" },
  { name: "Nirupama Vincent", role: "Frontend Developer" },
  { name: "Angel Blessy", role: "Backend Developer" },
];

const Footer = () => {
  return (
    <footer className="bg-[hsl(var(--footer-bg))] text-[hsl(var(--footer-text))]">
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Company Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-4">
              <Logo />
            </div>
            <p className="text-[hsl(var(--footer-muted))] mb-6 text-sm md:text-base">
              A student-focused companion for discovering food, stays, study zones and places around Christ University – Central Campus.
            </p>

            <div className="flex items-center gap-3 rounded-xl border border-[hsl(var(--footer-border))] bg-[hsl(var(--footer-bg))] px-4 py-3 mb-6">
              <img
                src={christLogoHref}
                alt="Christ University"
                className="h-8 w-auto"
                loading="lazy"
                decoding="async"
              />
              <div className="text-xs leading-snug">
                <div className="text-[hsl(var(--footer-text))] font-medium"> For Christ University</div>
                <div className="text-[hsl(var(--footer-muted))] opacity-90">Central Campus </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => toast.info("Twitter coming soon!")} className="w-10 h-10 rounded-full bg-[hsl(var(--footer-border))] flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all hover:scale-110 text-[hsl(var(--footer-muted))]">
                <Twitter className="w-5 h-5" />
              </button>
              <button onClick={() => toast.info("LinkedIn coming soon!")} className="w-10 h-10 rounded-full bg-[hsl(var(--footer-border))] flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all hover:scale-110 text-[hsl(var(--footer-muted))]">
                <Linkedin className="w-5 h-5" />
              </button>
              <button onClick={() => toast.info("GitHub coming soon!")} className="w-10 h-10 rounded-full bg-[hsl(var(--footer-border))] flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all hover:scale-110 text-[hsl(var(--footer-muted))]">
                <Github className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--footer-text))] mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/home" className="text-[hsl(var(--footer-muted))] hover:text-primary transition-colors text-sm md:text-base">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[hsl(var(--footer-muted))] hover:text-primary transition-colors text-sm md:text-base">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-[hsl(var(--footer-muted))] hover:text-primary transition-colors text-sm md:text-base">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-[hsl(var(--footer-muted))] hover:text-primary transition-colors text-sm md:text-base">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--footer-text))] mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-[hsl(var(--footer-muted))] text-sm md:text-base">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="truncate">vishwas.vashishta@mca.christuniversity.in</span>
              </li>
              <li className="flex items-center gap-3 text-[hsl(var(--footer-muted))] text-sm md:text-base">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                +91 7060200434
              </li>
              <li className="flex items-start gap-3 text-[hsl(var(--footer-muted))] text-sm md:text-base">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Christ University – Central Campus, Hosur Road, Bengaluru, Karnataka</span>
              </li>
            </ul>
          </div>

          {/* Development Team */}
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--footer-text))] mb-4">Development Team</h3>
            <ul className="space-y-3">
              {developers.map((dev, index) => (
                <li key={index} className="text-[hsl(var(--footer-muted))]">
                  <span className="font-medium text-[hsl(var(--footer-text))] text-sm md:text-base">{dev.name}</span>
                  <br />
                  <span className="text-xs md:text-sm opacity-80">{dev.role}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[hsl(var(--footer-border))] mt-10 md:mt-12 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[hsl(var(--footer-muted))] text-xs md:text-sm text-center md:text-left opacity-80">
            © {new Date().getFullYear()} UniEasy. All rights reserved.
          </p>
          <div className="flex gap-4 md:gap-6 text-xs md:text-sm text-[hsl(var(--footer-muted))]">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
