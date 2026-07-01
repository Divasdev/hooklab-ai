import { Sparkline } from './Sparkline';
import { ExampleScripts, type ExampleScript } from './ExampleScripts';

interface EmptyStateProps {
  onSelectExample: (example: ExampleScript) => void;
}

export function EmptyState({ onSelectExample }: EmptyStateProps) {
  return (
    <section className="rounded-md border border-dashed border-white/12 bg-surface/55 px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <Sparkline strength={0} muted animate={false} />
        <p className="mt-4 text-center font-mono text-sm text-muted">
          Paste a script above, or load a sample cut.
        </p>
        <ExampleScripts onSelect={onSelectExample} />
      </div>
    </section>
  );
}
