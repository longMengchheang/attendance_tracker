import React from "react";

export function AuthLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#E78995] to-[#FDC1CB] p-4">
      {/* Main Card Container */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        
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
