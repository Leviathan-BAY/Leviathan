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
      const baseStyles = "w-full transition-all duration-200 focus:outline-none";

      const variants = {
        default: "border border-[rgba(148,163,184,0.1)] bg-[rgba(30,41,59,0.4)] text-white",
        glass: "backdrop-blur-[8px] border border-[rgba(148,163,184,0.1)] bg-[rgba(30,41,59,0.4)] text-white focus:border-[#38BDF8] focus:shadow-[0_0_20px_rgba(56,189,248,0.3)]"
      };

      const sizes = {
        sm: "px-3 py-2 text-sm rounded-lg",
        md: "px-4 py-3 text-base rounded-xl",
        lg: "px-5 py-4 text-lg rounded-xl"
      };

      const errorStyles = error
        ? "border-red-400 focus:border-red-400 focus:shadow-[0_0_20px_rgba(248,113,113,0.3)]"
        : "";

      return `${baseStyles} ${variants[variant]} ${sizes[inputSize]} ${errorStyles} ${className}`;
    };

    const placeholderColor = "placeholder:text-[#64748B]";

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
        className={`text-sm font-semibold text-[#CBD5E1] mb-2 inline-block ${className}`}
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
        className={`text-red-400 text-sm mt-1 ${className}`}
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