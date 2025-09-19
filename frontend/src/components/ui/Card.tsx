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
      // 디자인 시스템: 글래스모피즘 효과 - backdrop-filter: blur(16px), 테두리: 1px solid rgba(56, 189, 248, 0.2)
      const baseStyles = "backdrop-blur-[16px] border border-[rgba(56,189,248,0.2)] rounded-[16px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300 ease-out";

      const variants = {
        // 기본: 투명도 40-60% 사용 rgba(30, 41, 59, 0.4)
        default: "bg-[rgba(30,41,59,0.4)]",
        // 호버: 수면 위로 살짝 떠오르는 듯한 미묘한 상승 효과와 함께, 카드 외곽에 Primary Glow가 강화됨
        hover: "bg-[rgba(30,41,59,0.4)] hover:bg-[rgba(30,41,59,0.5)] hover:translate-y-[-2px] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_20px_rgba(56,189,248,0.4)]",
        // 글로우: Primary Glow - 하늘색 계열의 은은한 발광 효과
        glow: "bg-[rgba(30,41,59,0.4)] shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_20px_rgba(56,189,248,0.3)]"
      };

      // 간격 시스템: 4px 기반 일관된 간격 (16px, 24px, 32px)
      const paddings = {
        sm: "p-4",   // 16px
        md: "p-6",   // 24px
        lg: "p-8"    // 32px
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
        className={`text-[24px] leading-[1.5] font-bold text-[#F8FAFC] mb-2 ${className}`}
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
        className={`text-[#94A3B8] text-[16px] leading-relaxed ${className}`}
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