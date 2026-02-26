import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-lg border bg-background px-4 py-3 text-base ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        accent: "border-accent/30 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30",
        glass: "bg-[rgba(var(--glass-bg),var(--glass-opacity))] backdrop-blur-[var(--glass-blur)] border-[var(--glass-border)] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:shadow-[var(--glass-glow-hover)]",
      },
      inputSize: {
        default: "h-11",
        sm: "h-9 px-3 text-sm",
        lg: "h-14 px-5 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
);

export interface InputProps
  extends React.ComponentProps<"input">,
  VariantProps<typeof inputVariants> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
