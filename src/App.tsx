import { Scissors } from 'lucide-react';
import { useMemo, useState } from 'react';

import { EmptyState } from './components/EmptyState';
import { HookCard } from './components/HookCard';
import { PlatformSelector } from './components/PlatformSelector';
import { ScriptInput } from './components/ScriptInput';
import { SkeletonCard } from './components/SkeletonCard';
import { generateHooks } from './services/hooksApi';
import type { HookResult, Platform } from './types/hooks';

const skeletonItems = Array.from({ length: 10 }, (_, index) => index);

function App() {
  const [script, setScript] = useState('');
  const [platform, setPlatform] = useState<Platform>('YouTube Shorts');
  const [hooks, setHooks] = useState<HookResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(
    () => script.trim().length >= 10 && !isLoading,
    [script, isLoading],
  );

  const cutHooks = async (): Promise<void> => {
    if (!canSubmit) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await generateHooks({ script, platform });
      setHooks(response.hooks);
    } catch (caughtError) {
      setHooks([]);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Couldn't cut those hooks. Try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg text-primary">
      <div className="mx-auto flex min-h-screen w-full max-w-[1720px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="grid gap-6 border-b border-white/10 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-amber">
              00:00 Hook Lab
            </p>
            <h1 className="max-w-4xl font-display text-[clamp(2.75rem,8vw,6.75rem)] font-semibold leading-[0.9] tracking-normal">
              Cut the first five seconds before the edit.
            </h1>
          </div>
          <div className="max-w-sm border-l-2 border-cyan/50 pl-4 font-mono text-sm leading-6 text-muted">
            Ten frameworks. One opening beat. Built for creators tuning
            retention before the timeline gets crowded.
          </div>
        </header>

        <section className="grid flex-1 gap-6 py-6 xl:grid-cols-[minmax(380px,0.82fr)_minmax(0,1.18fr)]">
          <form
            className="space-y-5 xl:sticky xl:top-6 xl:self-start"
            onSubmit={(event) => {
              event.preventDefault();
              void cutHooks();
            }}
          >
            <ScriptInput
              value={script}
              onChange={setScript}
              disabled={isLoading}
            />
            <PlatformSelector
              selectedPlatform={platform}
              onChange={setPlatform}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-amber px-5 py-3 font-display text-base font-semibold text-bg transition-colors hover:bg-[#ff9a57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted sm:w-auto"
            >
              <Scissors size={18} aria-hidden="true" />
              Cut 10 Hooks
            </button>
          </form>

          <section aria-live="polite" aria-busy={isLoading}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                Timeline Cuts
              </h2>
              <span className="font-mono text-xs text-muted">
                {isLoading
                  ? 'Cutting'
                  : hooks.length > 0
                    ? `${hooks.length}/10`
                    : 'Standby'}
              </span>
            </div>

            {error ? (
              <div
                role="alert"
                className="mb-5 rounded-md border border-amber/35 bg-amber/10 px-4 py-3 font-mono text-sm text-amber"
              >
                {error}
              </div>
            ) : null}

            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {skeletonItems.map((item) => (
                  <SkeletonCard key={item} />
                ))}
              </div>
            ) : hooks.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {hooks.map((hook, index) => (
                  <HookCard
                    key={`${hook.framework}-${hook.text}`}
                    hook={hook}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

export default App;
