import { useEffect, useState } from 'react';

import type { Platform } from '../types/hooks';
import { copyToClipboard } from '../utils/clipboard';
import { downloadHookImage } from '../utils/shareCard';
import { buildShareUrl } from '../utils/shareLink';

export interface HookActionTarget {
  text: string;
  framework: string;
  platform: Platform;
}

const useFlag = (): [boolean, (value: boolean) => void] => {
  const [value, setValue] = useState(false);
  useEffect(() => {
    if (!value) return;
    const timer = window.setTimeout(() => setValue(false), 1500);
    return () => window.clearTimeout(timer);
  }, [value]);
  return [value, setValue];
};

/** Copy, share-link and image export state shared by every hook surface. */
export function useHookActions({
  text,
  framework,
  platform,
}: HookActionTarget) {
  const [copied, setCopied] = useFlag();
  const [linkCopied, setLinkCopied] = useFlag();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const copy = async (): Promise<void> => {
    const ok = await copyToClipboard(text);
    setCopied(ok);
    setError(ok ? '' : 'Copy failed. Please try again.');
  };

  const share = async (): Promise<void> => {
    const url = buildShareUrl(
      { text, framework, platform },
      window.location.origin,
    );
    // Mobile browsers get the native share sheet; desktop copies the link.
    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title: 'A hook from HookLab.AI', url });
        return;
      } catch (shareError) {
        if (
          shareError instanceof DOMException &&
          shareError.name === 'AbortError'
        ) {
          return;
        }
      }
    }
    const ok = await copyToClipboard(url);
    setLinkCopied(ok);
    setError(ok ? '' : 'Could not copy the share link.');
  };

  const downloadImage = (): void => {
    setExporting(true);
    setError('');
    void downloadHookImage(text, framework, platform)
      .catch(() => setError('Image export failed. Please try again.'))
      .finally(() => setExporting(false));
  };

  return { copied, linkCopied, exporting, error, copy, share, downloadImage };
}
