import { useState } from "react";
import { Link } from "react-router-dom";
import { User, Menu, X, Home, Mail, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: "/home", label: "Home", icon: Home },
    { to: "/contact", label: "Contact", icon: Mail },
    { to: "/terms", label: "Terms", icon: FileText },
    { to: "/privacy", label: "Privacy", icon: Shield },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Mirror glass header */}
      <div className="mirror-header-shell">
        <div className="pointer-events-none absolute inset-0">
          <div className="mirror-header-overlay" />
          <div className="mirror-header-sheen" />
        </div>
        <div className="relative w-full px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <Logo imgClassName="h-[5.25rem] md:h-24 w-auto" />
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            
            <Link to="/profile">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full bg-background/60 backdrop-blur-md border-border/60 hover:bg-accent/15 w-10 h-10 transition-all duration-300"
              >
                <User className="w-5 h-5 text-foreground" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-full w-10 h-10 border border-border/60 bg-background/70 backdrop-blur-md shadow-sm hover:bg-accent/20 hover:shadow-md"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 py-4 space-y-2 bg-background/90 backdrop-blur-xl border-t border-border/60">
            <Link 
              to="/profile" 
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/15 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <User className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Profile</span>
            </Link>
            
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/15 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <link.icon className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
