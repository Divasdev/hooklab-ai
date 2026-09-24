import {
  Bookmark,
  Check,
  Copy,
  ImageDown,
  Link2,
  LoaderCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import type { Platform } from '../types/hooks';
import { downloadHookImage } from '../utils/shareCard';
import { buildShareUrl } from '../utils/shareLink';

interface HookActionsProps {
  text: string;
  framework: string;
  platform: Platform;
  saved: boolean;
  onSave: () => void;
}

export function HookActions({
  text,
  framework,
  platform,
  saved,
  onSave,
}: HookActionsProps) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);
  useEffect(() => {
    if (!linkCopied) return;
    const timer = window.setTimeout(() => setLinkCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [linkCopied]);
  const shareHook = async (): Promise<void> => {
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
  const buttonClass =
    'grid h-11 w-11 shrink-0 place-items-center rounded border border-white/10 text-muted hover:border-cyan/50 hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber';
  return (
    <div>
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          className={buttonClass}
          title={saved ? 'Remove from saved hooks' : 'Save hook'}
          aria-label={saved ? 'Remove from saved hooks' : 'Save hook'}
          aria-pressed={saved}
          onClick={onSave}
        >
          <Bookmark
            size={17}
            className={saved ? 'fill-amber text-amber' : ''}
          />
        </button>
        <button
          type="button"
          className={buttonClass}
          title="Copy hook"
          aria-label={copied ? 'Hook copied' : 'Copy hook'}
          onClick={() => {
            void copyToClipboard(text).then((ok) => {
              setCopied(ok);
              setError(ok ? '' : 'Copy failed. Please try again.');
            });
          }}
        >
          {copied ? <Check size={17} /> : <Copy size={17} />}
        </button>
        <button
          type="button"
          className={buttonClass}
          title="Share link to this hook"
          aria-label={
            linkCopied ? 'Share link copied' : 'Share link to this hook'
          }
          onClick={() => {
            void shareHook();
          }}
        >
          {linkCopied ? <Check size={17} /> : <Link2 size={17} />}
        </button>
        <button
          type="button"
          className={buttonClass}
          title="Download hook image"
          aria-label="Download hook image"
          disabled={exporting}
          onClick={() => {
            setExporting(true);
            setError('');
            void downloadHookImage(text, framework, platform)
              .catch(() => setError('Image export failed. Please try again.'))
              .finally(() => setExporting(false));
          }}
        >
          {exporting ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <ImageDown size={17} />
          )}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-amber">
          {error}
        </p>
      )}
    </div>
  );
}
