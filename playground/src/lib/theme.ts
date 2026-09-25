import { useCallback, useEffect, useState } from 'react';
import { storage, storageKeys } from './storage';

export type Theme = 'light' | 'dark';

/** Dark by default; the toggle picks a theme, which is then remembered. */
const resolve = (): Theme => (storage.read(storageKeys.theme) === 'light' ? 'light' : 'dark');

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(resolve);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggle = useCallback(() => {
    const next: Theme = resolve() === 'dark' ? 'light' : 'dark';
    storage.write(storageKeys.theme, next);
    setTheme(next);
  }, []);

  return { theme, toggle };
};
