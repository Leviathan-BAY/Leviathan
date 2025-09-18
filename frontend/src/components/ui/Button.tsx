import { forwardRef } from "react";
import { Button as RadixButton } from "@radix-ui/themes";
import type { ComponentPropsWithoutRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ComponentPropsWithoutRef<typeof RadixButton> {
  variant?: ButtonVariant;
  btnSize?: ButtonSize;
  glow?: boolean;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", btnSize = "md", glow = false, className = "", children, ...props }, ref) => {
    const getButtonStyles = (): string => {
      const baseStyles = "font-semibold transition-all duration-300 cursor-pointer inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2";

      const variants = {
        primary: "bg-gradient-to-br from-[#38BDF8] to-[#0EA5E9] text-white border-none hover:from-[#22D3EE] hover:to-[#3B82F6] hover:shadow-[0_8px_25px_rgba(56,189,248,0.4)] hover:scale-105",
        secondary: "bg-transparent text-[#38BDF8] border border-[#38BDF8] hover:bg-[rgba(56,189,248,0.1)] hover:shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:scale-105",
        ghost: "bg-transparent text-[#CBD5E1] border-none hover:text-[#38BDF8] hover:underline hover:scale-105",
        outline: "bg-transparent border border-[rgba(148,163,184,0.1)] text-white hover:border-[#38BDF8] hover:shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:scale-105"
      };

      const sizes = {
        sm: "px-3 py-2 text-sm rounded-md",
        md: "px-4 py-3 text-base rounded-lg",
        lg: "px-6 py-4 text-lg rounded-lg"
      };

      const glowStyle = glow ? "shadow-[0_4px_15px_rgba(56,189,248,0.3)]" : "";

      return `${baseStyles} ${variants[variant]} ${sizes[btnSize]} ${glowStyle} ${className}`;
    };

    return (
      <button
        ref={ref}
        className={getButtonStyles()}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };