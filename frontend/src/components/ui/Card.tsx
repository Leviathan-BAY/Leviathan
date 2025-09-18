import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";

interface CardProps extends ComponentPropsWithoutRef<"div"> {
  variant?: "default" | "hover" | "glow";
  padding?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", padding = "md", className = "", children, ...props }, ref) => {
    const getCardStyles = (): string => {
      const baseStyles = "backdrop-blur-[16px] border border-[rgba(148,163,184,0.1)] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300";

      const variants = {
        default: "bg-[rgba(30,41,59,0.4)]",
        hover: "bg-[rgba(30,41,59,0.4)] hover:bg-[rgba(30,41,59,0.6)] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_20px_rgba(56,189,248,0.3)]",
        glow: "bg-[rgba(30,41,59,0.4)] shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_20px_rgba(56,189,248,0.3)]"
      };

      const paddings = {
        sm: "p-4",
        md: "p-6",
        lg: "p-8"
      };

      return `${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`;
    };

    return (
      <div
        ref={ref}
        className={getCardStyles()}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

// Card Header Component
interface CardHeaderProps extends ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`mb-4 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

// Card Title Component
interface CardTitleProps extends ComponentPropsWithoutRef<"h3"> {
  children: React.ReactNode;
}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={`text-xl font-bold text-white mb-2 ${className}`}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

CardTitle.displayName = "CardTitle";

// Card Description Component
interface CardDescriptionProps extends ComponentPropsWithoutRef<"p"> {
  children: React.ReactNode;
}

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={`text-[#CBD5E1] text-base leading-relaxed ${className}`}
        {...props}
      >
        {children}
      </p>
    );
  }
);

CardDescription.displayName = "CardDescription";

// Card Content Component
interface CardContentProps extends ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode;
}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = "CardContent";

// Card Footer Component
interface CardFooterProps extends ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode;
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`mt-6 flex items-center justify-between ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export type { CardProps };