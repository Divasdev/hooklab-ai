import { useCallback, useEffect, useState } from 'react';
import type { Platform } from '../types/hooks';
import {
  parseSavedHooks,
  savedHookLimit,
  savedHookMatches,
  savedHooksKey,
  type SavedHook,
} from '../utils/savedHooks';
import { trackEvent } from '../utils/analytics';

export function useSavedHooks() {
  const [savedHooks, setSavedHooks] = useState<SavedHook[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      try {
        setSavedHooks(parseSavedHooks(localStorage.getItem(savedHooksKey)));
        setError(null);
      } catch {
        setError(
          'Your saved library could not be read. Browser storage may be unavailable.',
        );
      }
    };
    refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === savedHooksKey || event.key === null) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback(
    (change: (current: SavedHook[]) => SavedHook[]) => {
      try {
        const next = change(
          parseSavedHooks(localStorage.getItem(savedHooksKey)),
        );
        localStorage.setItem(savedHooksKey, JSON.stringify(next));
        setSavedHooks(next);
        setError(null);
      } catch (caught) {
        setError(
          caught instanceof Error && caught.message === 'Library full'
            ? `Your library has ${savedHookLimit} hooks. Export or remove a hook before saving another.`
            : 'Could not save this change. Check your browser storage and try again.',
        );
      }
    },
    [],
  );

  const toggle = (text: string, framework: string, platform: Platform) =>
    update((current) => {
      const existing = current.find((hook) =>
        savedHookMatches(hook, text, platform),
      );
      if (existing) return current.filter((hook) => hook.id !== existing.id);
      if (current.length >= savedHookLimit) throw new Error('Library full');
      trackEvent('hook_saved', { framework, platform });
      return [
        {
          id: crypto.randomUUID(),
          text,
          framework,
          platform,
          labels: '',
          createdAt: Date.now(),
        },
        ...current,
      ];
    });

  return {
    savedHooks,
    error,
    toggle,
    isSaved: (text: string, platform: Platform) =>
      savedHooks.some((hook) => savedHookMatches(hook, text, platform)),
    remove: (id: string) =>
      update((current) => current.filter((hook) => hook.id !== id)),
    setLabels: (id: string, labels: string) =>
      update((current) =>
        current.map((hook) =>
          hook.id === id ? { ...hook, labels: labels.slice(0, 120) } : hook,
        ),
      ),
  };
}
