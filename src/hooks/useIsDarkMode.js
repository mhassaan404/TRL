// src/hooks/useIsDarkMode.js
import { useState, useEffect } from 'react';

export const useIsDarkMode = () => {
  const [isDark, setIsDark] = useState(
    document.documentElement.getAttribute('data-coreui-theme') === 'dark'
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.getAttribute('data-coreui-theme');
      setIsDark(newTheme === 'dark');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-coreui-theme'],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
};