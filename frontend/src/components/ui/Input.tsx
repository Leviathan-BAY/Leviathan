import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";

interface InputProps extends ComponentPropsWithoutRef<"input"> {
  variant?: "default" | "glass";
  inputSize?: "sm" | "md" | "lg";
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant = "glass", inputSize = "md", error = false, className = "", ...props }, ref) => {
    const getInputStyles = (): string => {
      // 전환 시간: 일반 전환 300ms 사용
      const baseStyles = "w-full transition-all duration-300 ease-out focus:outline-none";

      const variants = {
        default: "border border-[rgba(56,189,248,0.2)] bg-[rgba(30,41,59,0.4)] text-[#F8FAFC]",
        // 글래스 배경과 얇은 테두리, 포커스 시 테두리 색상 변화 및 글로우
        glass: "backdrop-blur-[16px] border border-[rgba(56,189,248,0.2)] bg-[rgba(30,41,59,0.4)] text-[#F8FAFC] focus:border-[#38BDF8] focus:shadow-[0_0_20px_rgba(56,189,248,0.3)]"
      };

      // 폰트 크기 계층에 맞춘 크기
      const sizes = {
        sm: "px-3 py-2 text-[14px] rounded-lg",     // Body Small: 14px
        md: "px-4 py-3 text-[16px] rounded-lg",     // Body Medium: 16px
        lg: "px-5 py-4 text-[18px] rounded-lg"      // Body Large: 18px
      };

      const errorStyles = error
        ? "border-red-400 focus:border-red-400 focus:shadow-[0_0_20px_rgba(248,113,113,0.3)]"
        : "";

      return `${baseStyles} ${variants[variant]} ${sizes[inputSize]} ${errorStyles} ${className}`;
    };

    // 플레이스홀더 텍스트 일관성 - Muted 색상 사용
    const placeholderColor = "placeholder:text-[rgba(248,250,252,0.5)]";

    return (
      <input
        ref={ref}
        className={`${getInputStyles()} ${placeholderColor}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

// Label Component
interface LabelProps extends ComponentPropsWithoutRef<"label"> {
  children: React.ReactNode;
  required?: boolean;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, required = false, className = "", ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`text-[14px] font-semibold text-[#94A3B8] mb-2 inline-block ${className}`}
        {...props}
      >
        {children}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
    );
  }
);

Label.displayName = "Label";

// Error Message Component
interface ErrorMessageProps extends ComponentPropsWithoutRef<"p"> {
  children: React.ReactNode;
}

const ErrorMessage = forwardRef<HTMLParagraphElement, ErrorMessageProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={`text-red-400 text-[12px] mt-1 ${className}`}
        {...props}
      >
        {children}
      </p>
    );
  }
);

ErrorMessage.displayName = "ErrorMessage";

// Input Group Component for combining label, input, and error
interface InputGroupProps {
  label?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(
  ({ label, required = false, error, children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`space-y-1 ${className}`}
        {...props}
      >
        {label && (
          <Label required={required}>
            {label}
          </Label>
        )}
        {children}
        {error && (
          <ErrorMessage>
            {error}
          </ErrorMessage>
        )}
      </div>
    );
  }
);

InputGroup.displayName = "InputGroup";

export { Input, Label, ErrorMessage, InputGroup };
export type { InputProps };