import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  btnSize?: ButtonSize;
  glow?: boolean;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", btnSize = "md", glow = false, className = "", children, ...props }, ref) => {
    const getButtonStyles = (): string => {
      const variants = {
        primary: "btn-primary",
        secondary: "btn-secondary",
        ghost: "btn-ghost",
        outline: "btn-outline"
      };

      const sizes = {
        sm: "btn-sm",
        md: "btn-md",
        lg: "btn-lg"
      };

      const glowStyle = glow ? "glow-pulse" : "";

      return `${variants[variant]} ${sizes[btnSize]} ${glowStyle} ${className}`;
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