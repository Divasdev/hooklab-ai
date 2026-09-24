import { Check, ChevronDown, Copy, FileText, Share, Table } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import type {
  GenerateHooksRequest,
  HookResult,
  RoastCritique,
  CompareHooksResponse,
} from '../types/hooks';
import { copyToClipboard } from '../utils/clipboard';
import {
  buildHooksCsv,
  buildHooksPlainText,
  buildScriptNotes,
  downloadTextFile,
} from '../utils/export';

interface ExportBarProps {
  hooks: HookResult[];
  request: GenerateHooksRequest;
  roast?: RoastCritique;
  compare?: CompareHooksResponse;
}

const itemClass =
  'flex min-h-11 w-full items-center gap-2.5 rounded-md px-3 text-left text-sm text-secondary transition-colors hover:bg-white/5 hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber';

// One entry point that opens into the export options, instead of a row of buttons.
export function ExportBar({ hooks, request, roast, compare }: ExportBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 1500);

    return () => window.clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutside = (event: PointerEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const copyAll = async (): Promise<void> => {
    setCopied(
      await copyToClipboard(
        compare ? compare.improvedHook : buildHooksPlainText(hooks),
      ),
    );
  };

  const downloadCsv = (): void => {
    downloadTextFile('hooklab-ai-hooks.csv', buildHooksCsv(hooks), 'text/csv');
    setIsOpen(false);
  };

  const downloadNotes = (): void => {
    downloadTextFile(
      'hooklab-ai-script-notes.txt',
      buildScriptNotes(request, hooks, roast, compare),
      'text/plain',
    );
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/10 px-3 text-sm text-secondary transition hover:border-cyan/60 hover:text-cyan active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
      >
        <Share size={15} aria-hidden="true" />
        Export
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        id={menuId}
        hidden={!isOpen}
        className="absolute right-0 top-full z-20 mt-2 w-60 origin-top-right rounded-lg border border-white/10 bg-surface-elevated p-1.5 shadow-panel motion-safe:animate-menuIn"
      >
        <button
          type="button"
          onClick={() => {
            void copyAll();
          }}
          className={itemClass}
        >
          {copied ? (
            <Check size={16} aria-hidden="true" />
          ) : (
            <Copy size={16} aria-hidden="true" />
          )}
          {copied
            ? 'Copied'
            : compare
              ? 'Copy improved hook'
              : 'Copy all hooks'}
        </button>
        {!compare ? (
          <button type="button" onClick={downloadCsv} className={itemClass}>
            <Table size={16} aria-hidden="true" />
            Download spreadsheet (CSV)
          </button>
        ) : null}
        <button type="button" onClick={downloadNotes} className={itemClass}>
          <FileText size={16} aria-hidden="true" />
          Download script notes
        </button>
      </div>
    </div>
  );
}
