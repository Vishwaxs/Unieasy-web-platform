import { SignUp } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

/**
 * Renders the Clerk <SignUp /> component in a styled page shell.
 * After signup, Clerk redirects to /home (configured via afterSignUpUrl).
 */
const SignupPage = () => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Left side – Clerk SignUp form */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 lg:px-16 xl:px-24">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8 animate-fade-up">
            <Logo />
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex justify-center animate-fade-up stagger-1">
            <SignUp
              routing="path"
              path="/signup"
              signInUrl="/"
              afterSignUpUrl="/home"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border border-border rounded-2xl bg-card",
                  headerTitle: "text-foreground",
                  headerSubtitle: "text-muted-foreground",
                  socialButtonsBlockButton:
                    "border-border text-foreground hover:bg-muted",
                  formFieldLabel: "text-foreground",
                  formFieldInput:
                    "bg-background border-input text-foreground rounded-xl",
                  footerActionLink: "text-primary hover:text-primary/80",
                  formButtonPrimary:
                    "bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl",
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Right side – Decorative */}
      <div className="hidden lg:flex flex-1 hero-gradient items-center justify-center p-12">
        <div className="text-center text-primary-foreground animate-fade-up">
          <h2 className="text-4xl font-bold mb-4">Welcome to UniEasy</h2>
          <p className="text-lg opacity-90 max-w-md">
            Your one-stop platform for discovering food, accommodation, and
            amazing places around your campus.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
