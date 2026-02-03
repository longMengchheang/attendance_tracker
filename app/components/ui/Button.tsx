import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = "primary", 
  fullWidth = false, 
  className = "", 
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-sm px-8 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow-sm";
  
  const variants = {
    primary: "bg-[#F5A9B8] text-white hover:bg-[#F090A5] shadow-[#F5A9B8]/30 shadow-lg",
    secondary: "bg-gray-200 text-gray-700 hover:bg-gray-300",
  };

  const width = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${width} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
}
