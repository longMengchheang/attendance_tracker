import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; // Optional label if needed, though designs often hide it or use placeholder
}

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`flex h-12 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#F5A9B8] focus:ring-1 focus:ring-[#F5A9B8] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
