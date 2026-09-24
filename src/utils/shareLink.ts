import { platforms, type Platform } from '../types/hooks';

export interface SharedHook {
  text: string;
  framework: string;
  platform: Platform;
}

const maxTextLength = 400;
const maxFrameworkLength = 40;

// Hooks travel in the URL itself, so sharing needs no server storage.
export const buildShareUrl = (hook: SharedHook, origin: string): string => {
  const params = new URLSearchParams({
    h: hook.text.slice(0, maxTextLength),
    f: hook.framework.slice(0, maxFrameworkLength),
    p: hook.platform,
  });

  // /s serves link-preview tags for crawlers, then opens the app at /?h=…
  return `${origin}/s?${params.toString()}`;
};

export const parseSharedHook = (search: string): SharedHook | null => {
  const params = new URLSearchParams(search);
  const text = params.get('h')?.trim();
  const framework = params.get('f')?.trim() ?? '';
  const platform = params.get('p');

  if (!text || !platforms.includes(platform as Platform)) {
    return null;
  }

  return {
    text: text.slice(0, maxTextLength),
    framework: framework.slice(0, maxFrameworkLength),
    platform: platform as Platform,
  };
};
