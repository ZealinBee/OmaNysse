"use client";

import { useLocale } from "@/app/lib/locale-context";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  const toggleLanguage = () => {
    setLocale(locale === 'fi' ? 'en' : 'fi');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="text-white/50 text-xs hover:text-white/70 transition-colors underline"
      title={locale === 'fi' ? 'Switch to English' : 'Vaihda suomeksi'}
    >
      {locale === 'fi' ? 'In English' : 'Suomeksi'}
    </button>
  );
}
