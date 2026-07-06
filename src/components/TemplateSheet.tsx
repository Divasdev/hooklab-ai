import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import {
  templateCategories,
  templates,
  type ScriptTemplate,
  type TemplateCategory,
} from '../data/templates';

interface TemplateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: ScriptTemplate) => void;
  disabled?: boolean;
}

export function TemplateSheet({
  isOpen,
  onClose,
  onSelect,
  disabled = false,
}: TemplateSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  // Group templates by category
  const groupedTemplates = templateCategories.reduce(
    (acc, category) => {
      acc[category] = templates.filter((t) => t.category === category);
      return acc;
    },
    {} as Record<TemplateCategory, ScriptTemplate[]>,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/55 md:items-center md:justify-center motion-reduce:transition-none"
      onMouseDown={(event) => {
        if (
          panelRef.current &&
          !panelRef.current.contains(event.target as Node)
        ) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        className="flex h-[75vh] w-full flex-col overflow-hidden rounded-t-[16px] border border-white/10 bg-surface shadow-panel animate-[cardIn_300ms_cubic-bezier(0.2,0.8,0.2,1)_both] motion-reduce:animate-none md:h-[80vh] md:max-h-[800px] md:w-[600px] md:rounded-[12px]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-surface/95 px-5 py-4 backdrop-blur-md">
          <h2 className="font-display text-xl font-semibold text-primary">
            Templates
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close templates"
            className="grid h-10 w-10 place-items-center rounded-[4px] border border-white/10 text-muted transition-colors hover:border-cyan/50 hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-8">
            {templateCategories.map((category) => {
              const categoryTemplates = groupedTemplates[category];
              if (!categoryTemplates || categoryTemplates.length === 0)
                return null;

              return (
                <div key={category}>
                  <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.1em] text-muted">
                    {category}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {categoryTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          onSelect(template);
                          onClose();
                        }}
                        className="flex flex-col items-start gap-1.5 rounded-lg border border-white/5 bg-black/20 p-4 text-left transition-all hover:border-amber/40 hover:bg-black/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="font-semibold text-primary">
                          {template.title}
                        </span>
                        <span className="line-clamp-2 text-sm leading-relaxed text-muted">
                          "{template.script}"
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
