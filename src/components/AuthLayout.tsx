import React from "react";

export function AuthLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4">
      {/* Main Card Container */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-[500px] relative">
        {/* Left Accent Bar */}
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-[#F43F5E] to-[#FDA4AF] opacity-80 z-20"></div>
        
        {/* Left Side - Form */}
        <div className="w-full md:w-[45%] p-12 flex flex-col justify-center relative z-10">
          {title && (
            <h1 className="text-3xl font-bold text-gray-800 mb-10 text-center md:text-left">
              {title}
            </h1>
          )}
          {children}
        </div>

        {/* Right Side - Decorative */}
        <div className="hidden w-[55%] items-center justify-center p-8 md:flex">
          <div className="relative flex h-[400px] w-[400px] items-center justify-center">
            {/* The image provided by the user */}
             <div className="relative h-full w-full">
                <img 
                  src="/auth-decoration.png" 
                  alt="Decorative Art" 
                  className="h-full w-full object-contain scale-125"
                />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
