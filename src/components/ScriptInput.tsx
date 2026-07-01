import type { HookLanguage } from '../types/hooks';

interface ScriptInputProps {
  value: string;
  onChange: (value: string) => void;
  language: HookLanguage;
  disabled?: boolean;
}

const placeholders: Record<HookLanguage, string> = {
  English: 'Paste your video script or describe your idea...',
  Hinglish: 'Apna video script ya idea yahan paste karo...',
  Hindi: 'अपनी वीडियो स्क्रिप्ट या आइडिया यहाँ लिखें...',
};

export function ScriptInput({
  value,
  onChange,
  language,
  disabled = false,
}: ScriptInputProps) {
  return (
    <label className="block">
      <span className="mb-3 block font-mono text-xs uppercase tracking-[0.18em] text-muted">
        Script Slate
      </span>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholders[language]}
        minLength={20}
        rows={10}
        className="min-h-[250px] w-full resize-y rounded-md border border-white/10 border-t-2 border-t-amber bg-surface px-5 py-5 font-mono text-sm leading-7 text-primary shadow-panel outline-none transition-colors placeholder:text-muted/70 focus:border-cyan focus:border-t-amber focus:ring-2 focus:ring-cyan/30 disabled:cursor-not-allowed disabled:opacity-70"
      />
    </label>
  );
}
