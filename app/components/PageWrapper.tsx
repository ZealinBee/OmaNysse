"use client";

import { useState, useCallback, ReactNode } from "react";
import { REGION_COLORS } from "@/app/lib/types";
import DepartureBoard from "./DepartureBoard";
import AddToHomeScreenPrompt from "./AddToHomeScreenPrompt";

interface PageWrapperProps {
  children?: ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  const [themeColor, setThemeColor] = useState(REGION_COLORS.default);

  const handleThemeColorChange = useCallback((color: string) => {
    setThemeColor(color);
  }, []);

  return (
    <main
      className="min-h-screen p-6 sm:p-10 transition-colors duration-500 relative"
      style={{ backgroundColor: themeColor }}
    >
      <div className="max-w-2xl mx-auto pt-6">
        {/* Logo */}
        <div className="absolute top-[11px] left-3 sm:top-[23px] sm:left-6 flex items-center gap-2">
          <img
            src="/white%20logo%20bus.png"
            alt="SeuraavaBussi logo"
            className="h-6 sm:h-8"
          />
          <span className="text-white font-bold text-lg sm:text-xl">
            SeuraavaBussi.fi
          </span>
        </div>

        <DepartureBoard onThemeColorChange={handleThemeColorChange} />

        {/* Server-rendered children (footer) */}
        {children}
      </div>

      {/* Add to Home Screen prompt */}
      <AddToHomeScreenPrompt />
    </main>
  );
}
