"use client";

import { useLocale } from "@/app/lib/locale-context";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  const toggleLanguage = () => {
    setLocale(locale === 'fi' ? 'en' : 'fi');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white text-sm font-medium transition-all"
      title={locale === 'fi' ? 'Switch to English' : 'Vaihda suomeksi'}
    >
      <Globe className="w-4 h-4" />
      <span>{locale === 'fi' ? 'EN' : 'FI'}</span>
    </button>
  );
}
