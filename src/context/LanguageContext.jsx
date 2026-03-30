import React, { createContext, useContext, useState, useCallback } from 'react';
import translations from '../translations/index.js';

const LanguageContext = createContext();

// Map display names to language codes
const langCodeMap = {
    'English': 'en',
    'हिन्दी (Hindi)': 'hi',
    'తెలుగు (Telugu)': 'te',
};

const langNameMap = {
    'en': 'English',
    'hi': 'हिन्दी (Hindi)',
    'te': 'తెలుగు (Telugu)',
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState(() => {
        // Restore language from localStorage on page load
        const saved = localStorage.getItem('agriDharaLang');
        return saved && translations[saved] ? saved : 'en';
    });

    const setLanguage = useCallback((langDisplayName) => {
        const code = langCodeMap[langDisplayName] || langDisplayName;
        if (translations[code]) {
            setLanguageState(code);
            localStorage.setItem('agriDharaLang', code);
        }
    }, []);

    // t('nav.home') => returns the translation string for the current language
    const t = useCallback((key) => {
        const keys = key.split('.');
        let result = translations[language];
        for (const k of keys) {
            if (result && typeof result === 'object') {
                result = result[k];
            } else {
                return key; // fallback: return the key itself
            }
        }
        return result || key;
    }, [language]);

    return (
        <LanguageContext.Provider
            value={{
                language,
                langDisplayName: langNameMap[language],
                setLanguage,
                t,
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
