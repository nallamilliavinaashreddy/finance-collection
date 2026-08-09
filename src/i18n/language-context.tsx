'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, SUPPORTED_LANGUAGES, LanguageOption } from './types';
import { en } from './locales/en';
import { te } from './locales/te';
import { hi } from './locales/hi';
import { ta } from './locales/ta';
import { kn } from './locales/kn';

const dictionaries: Record<Language, typeof en> = {
  en,
  te,
  hi,
  ta,
  kn,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string, fallback?: string) => string;
  supportedLanguages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'fincollect_language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language preference from localStorage on mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_KEY) as Language;
      if (savedLang && dictionaries[savedLang]) {
        setLanguageState(savedLang);
      }
    } catch {
      // Fallback to default 'en'
    }
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    if (dictionaries[newLang]) {
      setLanguageState(newLang);
      try {
        localStorage.setItem(STORAGE_KEY, newLang);
      } catch {
        // Storage unavailable
      }
    }
  }, []);

  // Helper translation lookup function
  const t = useCallback(
    (keyPath: string, fallback?: string): string => {
      const keys = keyPath.split('.');
      let current: any = dictionaries[language] || dictionaries.en;

      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          // Fallback to English dictionary
          let enCurrent: any = dictionaries.en;
          for (const enKey of keys) {
            if (enCurrent && typeof enCurrent === 'object' && enKey in enCurrent) {
              enCurrent = enCurrent[enKey];
            } else {
              return fallback || keyPath;
            }
          }
          return typeof enCurrent === 'string' ? enCurrent : fallback || keyPath;
        }
      }

      return typeof current === 'string' ? current : fallback || keyPath;
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
