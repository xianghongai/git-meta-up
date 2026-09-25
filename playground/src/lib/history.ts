import { useCallback, useState } from 'react';
import { sanitizeGitUrl } from 'git-meta-up';
import { storage, storageKeys } from './storage';

export interface HistoryEntry {
  url: string;
  config: string;
  provider?: string;
  time: string;
}

const limit = 50;

const read = (): HistoryEntry[] => {
  try {
    const value: unknown = JSON.parse(storage.read(storageKeys.history) ?? '[]');
    return Array.isArray(value) ? (value as HistoryEntry[]) : [];
  } catch {
    return [];
  }
};

/** Parse history kept in this browser; the same input moves to the top instead of piling up. */
export const useHistory = () => {
  const [entries, setEntries] = useState<HistoryEntry[]>(read);

  const remember = useCallback((input: HistoryEntry) => {
    // History lives in the browser; never keep credentials from the URL.
    const entry = { ...input, url: sanitizeGitUrl(input.url) };
    const next = [entry, ...read().filter((item) => item.url !== entry.url || item.config !== entry.config)].slice(
      0,
      limit
    );
    storage.write(storageKeys.history, JSON.stringify(next));
    setEntries(next);
  }, []);

  const clear = useCallback(() => {
    storage.write(storageKeys.history, '[]');
    setEntries([]);
  }, []);

  return { entries, remember, clear };
};
