import { Bookmark, Copy, Download, Flame, Scissors, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useDialogFocus } from '../hooks/useDialogFocus';
import { platforms } from '../types/hooks';
import { copyToClipboard } from '../utils/clipboard';
import { downloadTextFile } from '../utils/export';
import {
  buildSavedHooksCsv,
  buildSavedHooksText,
  type SavedHook,
} from '../utils/savedHooks';
import { HookActions } from './HookActions';

interface Props {
  isOpen: boolean;
  hooks: SavedHook[];
  error: string | null;
  onClose: () => void;
  onRemove: (id: string) => void;
  onLabels: (id: string, labels: string) => void;
  onUse: (hook: SavedHook) => void;
  onCompare: (first: SavedHook, second: SavedHook) => void;
}

export function SavedHooksDrawer({
  isOpen,
  hooks,
  error,
  onClose,
  onRemove,
  onLabels,
  onUse,
  onCompare,
}: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState('');
  useDialogFocus(isOpen, panel, onClose);
  if (!isOpen) return null;
  const visible = hooks.filter(
    (hook) =>
      (!platform || hook.platform === platform) &&
      `${hook.text} ${hook.framework} ${hook.labels}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase().trim()),
  );
  const picked = visible.filter((hook) => selected.has(hook.id));
  const allSelected = visible.length > 0 && picked.length === visible.length;
  const fieldClass =
    'min-h-11 min-w-0 rounded border border-white/15 bg-bg px-3 text-sm text-primary focus:outline focus:outline-2 focus:outline-cyan';
  return (
    <div
      className="fixed inset-0 z-50 bg-black/55"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="saved-title"
        className="ml-auto flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-surface shadow-panel"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
          <div>
            <h2
              id="saved-title"
              className="font-display text-2xl font-semibold"
            >
              Saved Hooks{' '}
              <span className="text-sm text-muted">{hooks.length}</span>
            </h2>
            <p className="mt-1 text-xs text-muted">
              Stored in this browser. Clearing site data removes saved hooks.
            </p>
          </div>
          <button
            className="grid h-11 w-11 shrink-0 place-items-center rounded border border-white/10"
            aria-label="Close saved hooks"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-2 border-b border-white/10 p-4 sm:grid-cols-[1fr_auto]">
          <input
            type="search"
            aria-label="Search saved hooks"
            placeholder="Search hooks, frameworks, labels"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={fieldClass}
          />
          <select
            aria-label="Filter saved hooks by platform"
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
            className={fieldClass}
          >
            <option value="">All platforms</option>
            {platforms.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        {error && (
          <p role="alert" className="px-4 pt-3 text-sm text-amber">
            {error}
          </p>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {visible.length > 0 ? (
            <>
              <label className="mb-3 flex min-h-11 items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() =>
                    setSelected((current) => {
                      const next = new Set(current);
                      visible.forEach((hook) => {
                        if (allSelected) next.delete(hook.id);
                        else next.add(hook.id);
                      });
                      return next;
                    })
                  }
                  className="h-4 w-4 accent-cyan"
                />
                Select visible ({visible.length})
              </label>
              <div className="space-y-3">
                {visible.map((hook) => (
                  <article
                    key={hook.id}
                    className="rounded-md border border-white/10 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${hook.text}`}
                        checked={selected.has(hook.id)}
                        onChange={() =>
                          setSelected((current) => {
                            const next = new Set(current);
                            if (next.has(hook.id)) next.delete(hook.id);
                            else next.add(hook.id);
                            return next;
                          })
                        }
                        className="mt-1 h-4 w-4 shrink-0 accent-cyan"
                      />
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-amber">
                          {hook.framework}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {hook.platform}
                        </p>
                      </div>
                    </div>
                    <p className="my-4 break-words text-lg font-semibold leading-7">
                      {hook.text}
                    </p>
                    <label className="block text-xs text-muted">
                      Labels
                      <input
                        aria-label={`Labels for ${hook.text}`}
                        maxLength={120}
                        value={hook.labels}
                        onChange={(event) =>
                          onLabels(hook.id, event.target.value)
                        }
                        placeholder="e.g. launch, fitness"
                        className={`${fieldClass} mt-1 w-full`}
                      />
                    </label>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <HookActions
                        text={hook.text}
                        framework={hook.framework}
                        platform={hook.platform}
                        saved
                        onSave={() => onRemove(hook.id)}
                      />
                      <button
                        className="inline-flex min-h-11 items-center gap-2 text-sm text-cyan"
                        onClick={() => onUse(hook)}
                      >
                        <Flame size={16} />
                        Roast this hook
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-muted">
              <Bookmark className="mx-auto mb-4" size={28} />
              <p>
                {hooks.length
                  ? 'No hooks match these filters.'
                  : 'No saved hooks yet.'}
              </p>
            </div>
          )}
        </div>
        <div className="border-t border-white/10 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted">{picked.length} selected</span>
            <button
              disabled={!picked.length}
              className="inline-flex min-h-11 items-center gap-2 text-sm text-cyan disabled:opacity-40"
              onClick={() => {
                void copyToClipboard(buildSavedHooksText(picked)).then((ok) =>
                  setNotice(
                    ok
                      ? 'Selected hooks copied.'
                      : 'Copy failed. Please try again.',
                  ),
                );
              }}
            >
              <Copy size={16} />
              Copy
            </button>
            <button
              disabled={!picked.length}
              className="inline-flex min-h-11 items-center gap-2 text-sm text-cyan disabled:opacity-40"
              onClick={() =>
                downloadTextFile(
                  'hooklab-saved-hooks.csv',
                  buildSavedHooksCsv(picked),
                  'text/csv;charset=utf-8',
                )
              }
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              disabled={
                picked.length !== 2 ||
                picked[0]?.platform !== picked[1]?.platform
              }
              title="Compare two hooks from the same platform"
              className="inline-flex min-h-11 items-center gap-2 text-sm text-cyan disabled:opacity-40"
              onClick={() => {
                if (picked.length === 2) onCompare(picked[0], picked[1]);
              }}
            >
              <Scissors size={16} />
              Compare 2
            </button>
          </div>
          <p role="status" className="mt-1 text-xs text-muted">
            {notice}
          </p>
        </div>
      </aside>
    </div>
  );
}
