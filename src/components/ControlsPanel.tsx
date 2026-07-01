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

interface ControlsPanelProps {
  tone: Tone;
  audience: Audience;
  intensity: Intensity;
  language: HookLanguage;
  hookWindow: HookWindow;
  disabled?: boolean;
  onToneChange: (tone: Tone) => void;
  onAudienceChange: (audience: Audience) => void;
  onIntensityChange: (intensity: Intensity) => void;
  onLanguageChange: (language: HookLanguage) => void;
  onHookWindowChange: (hookWindow: HookWindow) => void;
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
      <legend className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        {label}
      </legend>
      <div className="grid rounded-md border border-white/10 bg-black/20 p-1">
        {values.map((value) => {
          const isSelected = value === selectedValue;

          return (
            <button
              key={value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(value)}
              className={`min-h-9 rounded-[4px] px-2 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? 'bg-amber text-bg shadow-amber'
                  : 'text-muted hover:bg-white/5 hover:text-cyan'
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
  disabled = false,
  onToneChange,
  onAudienceChange,
  onIntensityChange,
  onLanguageChange,
  onHookWindowChange,
}: ControlsPanelProps) {
  return (
    <section className="grid gap-3 rounded-md border border-white/10 bg-surface/70 p-3 sm:grid-cols-2">
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
        label="Hook Window"
        values={hookWindows}
        selectedValue={hookWindow}
        disabled={disabled}
        formatValue={(value) => `${value} sec`}
        onChange={onHookWindowChange}
      />
    </section>
  );
}
