import {
  Bookmark,
  Check,
  Copy,
  ImageDown,
  Link2,
  LoaderCircle,
} from 'lucide-react';
import { useHookActions, type HookActionTarget } from '../hooks/useHookActions';

interface HookActionsProps extends HookActionTarget {
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
  const actions = useHookActions({ text, framework, platform });
  const buttonClass =
    'grid h-11 w-11 shrink-0 place-items-center rounded border border-white/10 text-muted transition hover:border-cyan/50 hover:text-cyan active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber';
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
          aria-label={actions.copied ? 'Hook copied' : 'Copy hook'}
          onClick={() => void actions.copy()}
        >
          {actions.copied ? <Check size={17} /> : <Copy size={17} />}
        </button>
        <button
          type="button"
          className={buttonClass}
          title="Share link to this hook"
          aria-label={
            actions.linkCopied ? 'Share link copied' : 'Share link to this hook'
          }
          onClick={() => void actions.share()}
        >
          {actions.linkCopied ? <Check size={17} /> : <Link2 size={17} />}
        </button>
        <button
          type="button"
          className={buttonClass}
          title="Download hook image"
          aria-label="Download hook image"
          disabled={actions.exporting}
          onClick={actions.downloadImage}
        >
          {actions.exporting ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <ImageDown size={17} />
          )}
        </button>
      </div>
      {actions.error && (
        <p role="alert" className="mt-2 text-xs text-amber">
          {actions.error}
        </p>
      )}
    </div>
  );
}
