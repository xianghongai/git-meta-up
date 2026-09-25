// localStorage may be unavailable (private mode, blocked storage); the page works without it.
export const storage = {
  read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  write(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
};

export const storageKeys = {
  config: 'git-meta-up:config',
  history: 'git-meta-up:history',
  theme: 'git-meta-up:theme',
};
