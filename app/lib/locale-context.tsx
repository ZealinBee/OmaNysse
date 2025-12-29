"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Locale, defaultLocale, LOCALE_STORAGE_KEY } from '@/i18n/config';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// Detect if user's browser language is Finnish
function detectPreferredLocale(): Locale {
  if (typeof navigator === 'undefined') return defaultLocale;

  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || '';
  // If browser language starts with 'fi', use Finnish, otherwise English
  return browserLang.toLowerCase().startsWith('fi') ? 'fi' : 'en';
}

export function LocaleProvider({ children, initialLocale }: { children: ReactNode; initialLocale: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // On mount, check localStorage for user preference, or detect from browser
  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;

    if (stored && (stored === 'fi' || stored === 'en')) {
      // User has a stored preference
      if (stored !== locale) {
        setLocaleState(stored);
        document.cookie = `${LOCALE_STORAGE_KEY}=${stored};path=/;max-age=31536000`;
        window.location.reload();
      }
    } else {
      // No stored preference - detect from browser language
      const detected = detectPreferredLocale();
      if (detected !== locale) {
        // Save the detected preference
        localStorage.setItem(LOCALE_STORAGE_KEY, detected);
        document.cookie = `${LOCALE_STORAGE_KEY}=${detected};path=/;max-age=31536000`;
        window.location.reload();
      } else {
        // Same as server default, just save it
        localStorage.setItem(LOCALE_STORAGE_KEY, detected);
        document.cookie = `${LOCALE_STORAGE_KEY}=${detected};path=/;max-age=31536000`;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    if (newLocale === locale) return;

    // Save to localStorage
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    // Set cookie for server-side
    document.cookie = `${LOCALE_STORAGE_KEY}=${newLocale};path=/;max-age=31536000`;
    // Update state
    setLocaleState(newLocale);
    // Reload to get new translations from server
    window.location.reload();
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
