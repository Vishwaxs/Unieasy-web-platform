import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signupStep1Schema, type SignupStep1Data } from "@/lib/validations";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

const SignupStep1 = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<SignupStep1Data>({
    resolver: zodResolver(signupStep1Schema),
    mode: "onChange",
  });

  const password = watch("password", "");
  const confirmPassword = watch("confirmPassword", "");

  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const metCount = passwordRequirements.filter((r) => r.met).length;
  const strengthPercent = (metCount / passwordRequirements.length) * 100;
  const strengthColor =
    metCount <= 1 ? "bg-destructive" :
    metCount <= 2 ? "bg-orange-500" :
    metCount <= 3 ? "bg-yellow-500" :
    metCount <= 4 ? "bg-lime-500" :
    "bg-green-500";
  const strengthLabel =
    metCount <= 1 ? "Weak" :
    metCount <= 2 ? "Fair" :
    metCount <= 3 ? "Good" :
    metCount <= 4 ? "Strong" :
    "Excellent";

  const confirmPasswordMatches = confirmPassword.length > 0 && password === confirmPassword;
  const confirmPasswordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const onSubmit = (data: SignupStep1Data) => {
    // Store data temporarily for step 2
    sessionStorage.setItem("signupStep1", JSON.stringify(data));
    navigate("/signup-step2");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 xl:px-24">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8 animate-fade-up">
            <Logo />
          </div>

          <div className="animate-fade-up stagger-1">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Create your account
            </h1>
            <p className="text-muted-foreground mb-8">
              Step 1 of 2 - Basic Information
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="animate-fade-up stagger-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Name
              </label>
              <Input
                {...register("fullName")}
                placeholder="Enter your full name"
                variant="accent"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <div className="animate-fade-up stagger-3">
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <Input
                {...register("email")}
                type="email"
                placeholder="you@university.edu"
                variant="accent"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="animate-fade-up stagger-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  variant="accent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
              )}
              
              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Password strength</span>
                    <span className={`text-xs font-medium ${metCount === 5 ? "text-green-500" : "text-muted-foreground"}`}>{strengthLabel}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                      style={{ width: `${strengthPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Password requirements */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`w-4 h-4 transition-colors ${
                        req.met ? "text-success" : "text-muted-foreground/40"
                      }`}
                    />
                    <span className={`text-xs ${req.met ? "text-success" : "text-muted-foreground"}`}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-fade-up stagger-5">
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  {...register("confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  variant="accent"
                  className={
                    confirmPasswordMatches ? "border-green-500 focus-visible:ring-green-500" :
                    confirmPasswordMismatch ? "border-destructive focus-visible:ring-destructive" :
                    ""
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full mt-8 animate-fade-up"
              disabled={!isValid}
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </Button>
          </form>

          <p className="mt-6 text-center text-muted-foreground animate-fade-up">
            Already have an account?{" "}
            <Link to="/" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 hero-gradient items-center justify-center p-12">
        <div className="text-center text-primary-foreground animate-fade-up">
          <h2 className="text-4xl font-bold mb-4">Welcome to UniEasy</h2>
          <p className="text-lg opacity-90 max-w-md">
            Your one-stop platform for discovering food, accommodation, and amazing places around your campus.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <div className="w-3 h-3 rounded-full bg-white" />
            <div className="w-3 h-3 rounded-full bg-primary-foreground/40" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupStep1;
