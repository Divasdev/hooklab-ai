import { Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const phrases = ['Stuck? Tap here', '12 ready scripts', 'Steal a script'];

interface TemplateTriggerProps {
  onClick: () => void;
}

export function TemplateTrigger({ onClick }: TemplateTriggerProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [shouldPulse, setShouldPulse] = useState(false);

  useEffect(() => {
    // Check local storage for first visit
    const hasSeenTemplates = localStorage.getItem('hooklab_templates_seen');
    if (!hasSeenTemplates) {
      setShouldPulse(true);
      // Wait for pulse animation to finish before setting the flag
      const timeout = setTimeout(() => {
        localStorage.setItem('hooklab_templates_seen', 'true');
        setShouldPulse(false);
      }, 1200); // 2 pulses * ~600ms
      return () => clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    // Rotate phrases every 3 seconds
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    // TODO: adjust bottom positioning to 88px when mobile bottom nav ships in Phase 2
    <button
      type="button"
      onClick={onClick}
      className={`fixed bottom-6 left-6 z-40 flex h-12 items-center gap-2 rounded-full border border-amber/40 bg-surface-elevated px-5 text-sm font-medium text-primary shadow-panel transition-all hover:border-amber/80 hover:bg-surface-elevated/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan md:h-14 md:text-base ${
        shouldPulse ? 'animate-triggerPulse' : ''
      }`}
    >
      <Wand2 size={18} className="text-amber" />
      <div className="relative w-[130px] overflow-hidden text-left h-5">
        {phrases.map((phrase, index) => (
          <span
            key={phrase}
            className={`absolute left-0 top-0 w-full whitespace-nowrap transition-opacity duration-250 ${
              index === phraseIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {phrase}
          </span>
        ))}
      </div>
    </button>
  );
}
