import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useId, useState } from 'react';

import {
  audiences,
  hookWindows,
  intensities,
  languages,
  tones,
  type Audience,
  type HookLanguage,
  type HookWindow,
  type Intensity,
  type Tone,
} from '../types/hooks';
import { Reveal } from './Reveal';

interface ControlsPanelProps {
  tone: Tone;
  audience: Audience;
  intensity: Intensity;
  language: HookLanguage;
  hookWindow: HookWindow;
  niche: string;
  disabled?: boolean;
  onToneChange: (tone: Tone) => void;
  onAudienceChange: (audience: Audience) => void;
  onIntensityChange: (intensity: Intensity) => void;
  onLanguageChange: (language: HookLanguage) => void;
  onHookWindowChange: (hookWindow: HookWindow) => void;
  onNicheChange: (niche: string) => void;
}

interface SegmentGroupProps<TValue extends string | number> {
  label: string;
  values: readonly TValue[];
  selectedValue: TValue;
  disabled?: boolean;
  formatValue?: (value: TValue) => string;
  onChange: (value: TValue) => void;
}

function SegmentGroup<TValue extends string | number>({
  label,
  values,
  selectedValue,
  disabled = false,
  formatValue,
  onChange,
}: SegmentGroupProps<TValue>) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-xs font-medium text-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const isSelected = value === selectedValue;

          return (
            <button
              key={value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(value)}
              className={`min-h-11 rounded-full border px-3.5 text-sm transition active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? 'border-amber bg-amber font-semibold text-bg'
                  : 'border-white/10 text-secondary hover:border-cyan/50 hover:text-cyan'
              }`}
            >
              {formatValue ? formatValue(value) : value}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ControlsPanel({
  tone,
  audience,
  intensity,
  language,
  hookWindow,
  niche,
  disabled = false,
  onToneChange,
  onAudienceChange,
  onIntensityChange,
  onLanguageChange,
  onHookWindowChange,
  onNicheChange,
}: ControlsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  return (
    <section className="rounded-lg border border-white/10 bg-surface/70">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-h-12 w-full items-center gap-3 rounded-lg px-4 py-2 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
      >
        <SlidersHorizontal
          size={16}
          className="shrink-0 text-amber"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-primary">
            Fine-tune
          </span>
          <span className="block truncate text-xs text-muted">
            {niche.trim() ? `${niche.trim()} · ` : ''}
            {tone} · {audience} · {intensity} · {language} · {hookWindow} sec
          </span>
        </span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={`shrink-0 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <Reveal open={isOpen} id={panelId}>
        <div className="grid gap-4 border-t border-white/10 px-4 pb-4 pt-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-xs font-medium text-muted">
              Your niche <span className="font-normal">(optional)</span>
            </span>
            <input
              type="text"
              value={niche}
              maxLength={60}
              disabled={disabled}
              onChange={(event) => onNicheChange(event.target.value)}
              placeholder="e.g. home cooking, UPSC prep, indie SaaS"
              className="min-h-11 w-full rounded-md border border-white/10 bg-bg/60 px-3 text-sm text-primary outline-none transition-colors placeholder:text-muted/70 focus:border-cyan focus:ring-2 focus:ring-cyan/30 disabled:opacity-60"
            />
          </label>
          <SegmentGroup
            label="Tone"
            values={tones}
            selectedValue={tone}
            disabled={disabled}
            onChange={onToneChange}
          />
          <SegmentGroup
            label="Audience"
            values={audiences}
            selectedValue={audience}
            disabled={disabled}
            onChange={onAudienceChange}
          />
          <SegmentGroup
            label="Intensity"
            values={intensities}
            selectedValue={intensity}
            disabled={disabled}
            onChange={onIntensityChange}
          />
          <SegmentGroup
            label="Language"
            values={languages}
            selectedValue={language}
            disabled={disabled}
            onChange={onLanguageChange}
          />
          <SegmentGroup
            label="Hook length"
            values={hookWindows}
            selectedValue={hookWindow}
            disabled={disabled}
            formatValue={(value) => `${value} sec`}
            onChange={onHookWindowChange}
          />
        </div>
      </Reveal>
    </section>
  );
}
