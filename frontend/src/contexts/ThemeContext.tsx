import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'dark' | 'light' | 'sepia';

interface ThemeContextType {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
    themes: { value: ThemeMode; label: string; icon: string }[];
}

const ThemeContext = createContext<ThemeContextType>(null!);

const THEMES: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'dark', label: 'Escuro', icon: '🌙' },
    { value: 'light', label: 'Claro', icon: '☀️' },
    { value: 'sepia', label: 'Sépia', icon: '📜' },
];

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>(() => {
        const saved = localStorage.getItem('studylog-theme');
        return (saved as ThemeMode) || 'light';
    });

    const setTheme = (newTheme: ThemeMode) => {
        setThemeState(newTheme);
        localStorage.setItem('studylog-theme', newTheme);
    };

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
