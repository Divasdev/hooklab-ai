import type { Platform } from '../types/hooks';

export interface SavedHook {
  id: string;
  text: string;
  framework: string;
  platform: Platform;
  labels: string;
  createdAt: number;
}

export const savedHooksKey = 'hooklab_saved_hooks_v1';
export const savedHookLimit = 200;

export function parseSavedHooks(raw: string | null): SavedHook[] {
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Invalid saved library');
  const ids = new Set<string>();
  return parsed
    .filter((value: unknown): value is SavedHook => {
      if (!value || typeof value !== 'object') return false;
      const item = value as Record<string, unknown>;
      const valid =
        typeof item.id === 'string' &&
        !ids.has(item.id) &&
        typeof item.text === 'string' &&
        item.text.length > 0 &&
        item.text.length <= 3000 &&
        typeof item.framework === 'string' &&
        item.framework.length <= 80 &&
        typeof item.platform === 'string' &&
        ['YouTube Shorts', 'Instagram Reels', 'TikTok'].includes(
          item.platform,
        ) &&
        typeof item.labels === 'string' &&
        item.labels.length <= 120 &&
        typeof item.createdAt === 'number' &&
        Number.isFinite(item.createdAt);
      if (valid && typeof item.id === 'string') ids.add(item.id);
      return valid;
    })
    .slice(0, savedHookLimit);
}

export const savedHookMatches = (
  hook: SavedHook,
  text: string,
  platform: Platform,
) => hook.text === text && hook.platform === platform;

export const buildSavedHooksText = (hooks: SavedHook[]) =>
  hooks
    .map(
      (hook) =>
        `[${hook.framework}] | ${hook.platform}\n${hook.text}${hook.labels ? `\nLabels: ${hook.labels}` : ''}`,
    )
    .join('\n\n');

export const buildSavedHooksCsv = (hooks: SavedHook[]) => {
  const escape = (value: string) =>
    `"${(/^[=+@\-\t\r]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`;
  return [
    ['Hook', 'Framework', 'Platform', 'Labels'],
    ...hooks.map((hook) => [
      hook.text,
      hook.framework,
      hook.platform,
      hook.labels,
    ]),
  ]
    .map((row) => row.map(escape).join(','))
    .join('\n');
};
