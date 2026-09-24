import {
  Bookmark,
  Clock3,
  Flame,
  Moon,
  Scissors,
  Sun,
  Wand2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BackToTop } from './components/BackToTop';
import { BottomTabBar } from './components/BottomTabBar';
import { ComparisonSection } from './components/ComparisonSection';
import { CompareCard } from './components/CompareCard';
import { ControlsPanel } from './components/ControlsPanel';
import { ExampleChips } from './components/ExampleChips';
import { ExportBar } from './components/ExportBar';
import { HistoryDrawer } from './components/HistoryDrawer';
import { HookCard } from './components/HookCard';
import { ModeToggle } from './components/ModeToggle';
import { PlatformSelector } from './components/PlatformSelector';
import { RoastCard } from './components/RoastCard';
import { ScriptInput } from './components/ScriptInput';
import { ScriptOutline } from './components/ScriptOutline';
import { SkeletonCard } from './components/SkeletonCard';
import { TemplateSheet } from './components/TemplateSheet';
import { WordSwap } from './components/WordSwap';
import { type ScriptTemplate } from './data/templates';
import { useHistory } from './hooks/useHistory';
import { useSavedHooks } from './hooks/useSavedHooks';
import { SavedHooksDrawer } from './components/SavedHooksDrawer';
import { SharedHookCard } from './components/SharedHookCard';
import { readDraft, writeDraft } from './utils/draft';
import { parseSharedHook, type SharedHook } from './utils/shareLink';
import {
  expandHook,
  generateHooks,
  HookLabApiError,
  rewriteHook,
} from './services/hooksApi';
import type {
  Audience,
  GenerateHooksRequest,
  HistoryEntry,
  HookLanguage,
  HookResult,
  HookWindow,
  Intensity,
  Mode,
  Platform,
  RewriteDirection,
  RoastCritique,
  Tone,
  CompareHooksResponse,
  ScriptOutline as ScriptOutlineData,
} from './types/hooks';

const skeletonItems = Array.from({ length: 10 }, (_, index) => index);
type ThemePreference = 'default' | 'night';

function App() {
  const [initialDraft] = useState(readDraft);
  const [script, setScript] = useState(initialDraft.script);
  const [platform, setPlatform] = useState<Platform>(initialDraft.platform);
  const [tone, setTone] = useState<Tone>(initialDraft.tone);
  const [audience, setAudience] = useState<Audience>(initialDraft.audience);
  const [intensity, setIntensity] = useState<Intensity>(initialDraft.intensity);
  const [language, setLanguage] = useState<HookLanguage>(initialDraft.language);
  const [hookWindow, setHookWindow] = useState<HookWindow>(
    initialDraft.hookWindow,
  );
  const [mode, setMode] = useState<Mode>(initialDraft.mode);
  const [hookB, setHookB] = useState(initialDraft.hookB);
  const [sharedHook, setSharedHook] = useState<SharedHook | null>(() =>
    parseSharedHook(window.location.search),
  );
  const [hooks, setHooks] = useState<HookResult[]>([]);
  const [roast, setRoast] = useState<RoastCritique | null>(null);
  const [compareResult, setCompareResult] =
    useState<CompareHooksResponse | null>(null);
  const [roastOriginalHook, setRoastOriginalHook] = useState('');
  const [previousHooks, setPreviousHooks] = useState<
    Partial<Record<HookResult['framework'], HookResult>>
  >({});
  const [currentRequest, setCurrentRequest] =
    useState<GenerateHooksRequest | null>(null);
  const [successfulResultId, setSuccessfulResultId] = useState(0);
  const [inputError, setInputError] = useState<string | null>(null);
  const [surfaceError, setSurfaceError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rewritingFramework, setRewritingFramework] = useState<
    HookResult['framework'] | null
  >(null);
  const [expandingKeys, setExpandingKeys] = useState<Set<string>>(new Set());
  const resultVersion = useRef(0);
  const expansionRequests = useRef(new Set<string>());
  const [expandErrors, setExpandErrors] = useState<Record<string, string>>({});
  const [scriptOutline, setScriptOutline] = useState<ScriptOutlineData | null>(
    null,
  );
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const closeOutline = useCallback(() => setIsOutlineOpen(false), []);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const closeLibrary = useCallback(() => setIsLibraryOpen(false), []);
  const [isTemplateSheetOpen, setIsTemplateSheetOpen] = useState(false);
  const [themePreference, setThemePreference] = useState<ThemePreference>(() =>
    document.documentElement.dataset.theme === 'night' ? 'night' : 'default',
  );
  const resultsRef = useRef<HTMLDivElement>(null);
  const { entries, saveEntry, deleteEntry, clearEntries } = useHistory();
  const library = useSavedHooks();
  const resultPlatform = currentRequest?.platform ?? platform;
  const resultHookA = currentRequest?.script ?? script;
  const resultHookB = currentRequest?.hookB ?? hookB;
  const winnerHook = compareResult?.winner === 'B' ? resultHookB : resultHookA;

  const minLength = mode === 'roast' ? 5 : 20;

  const canSubmit = useMemo(() => {
    if (isLoading) return false;

    const isHookAValid =
      script.trim().length >= minLength && script.trim().length <= 3000;
    if (mode === 'compare') {
      const isHookBValid =
        hookB.trim().length >= minLength && hookB.trim().length <= 3000;
      return isHookAValid && isHookBValid;
    }
    return isHookAValid;
  }, [script, hookB, isLoading, minLength, mode]);

  const sortedHooks = useMemo(
    () =>
      [...hooks].sort((first, second) => {
        if (first.best_pick === second.best_pick) {
          return 0;
        }

        return first.best_pick ? -1 : 1;
      }),
    [hooks],
  );

  const buildRequest = (): GenerateHooksRequest => ({
    script: script.trim(),
    hookB: mode === 'compare' ? hookB.trim() : undefined,
    platform,
    tone,
    audience,
    intensity,
    language,
    hookWindow,
    mode,
  });

  useEffect(() => {
    const hasResults = compareResult !== null || hooks.length > 0;

    if (successfulResultId === 0 || isLoading || !hasResults) {
      return;
    }

    const resultsElement = resultsRef.current;
    if (!resultsElement) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

      resultsElement.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [compareResult, hooks.length, isLoading, successfulResultId]);

  useEffect(() => {
    const timeout = window.setTimeout(
      () =>
        writeDraft({
          script,
          hookB,
          platform,
          tone,
          audience,
          intensity,
          language,
          hookWindow,
          mode,
        }),
      400,
    );

    return () => window.clearTimeout(timeout);
  }, [
    script,
    hookB,
    platform,
    tone,
    audience,
    intensity,
    language,
    hookWindow,
    mode,
  ]);

  useEffect(() => {
    // Keep the address bar clean so a refresh doesn't reopen the shared hook.
    if (parseSharedHook(window.location.search)) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (themePreference === 'night') {
      document.documentElement.dataset.theme = 'night';
    } else {
      delete document.documentElement.dataset.theme;
    }
  }, [themePreference]);

  const handleError = (caughtError: unknown): void => {
    if (caughtError instanceof HookLabApiError) {
      if (caughtError.status === 400) {
        setInputError(caughtError.message);
        return;
      }

      setSurfaceError(caughtError.message);
      return;
    }

    setSurfaceError('Something went wrong on our end. Try again.');
  };

  const cutHooks = async (): Promise<void> => {
    const request = buildRequest();

    if (!canSubmit) {
      setInputError(`Script must be between ${minLength} and 3000 characters.`);
      return;
    }

    setIsLoading(true);
    resultVersion.current += 1;
    expansionRequests.current.clear();
    setExpandingKeys(new Set());
    setInputError(null);
    setSurfaceError(null);
    setPreviousHooks({});
    setExpandErrors({});
    setIsOutlineOpen(false);

    try {
      const response = await generateHooks(request);

      if (response.mode === 'compare') {
        setHooks([]);
        setRoast(null);
        setRoastOriginalHook('');
        setCompareResult(response.compare);
        setCurrentRequest(request);
        setSuccessfulResultId((currentId) => currentId + 1);
        saveEntry(request, undefined, undefined, response.compare);
      } else if (response.mode === 'roast') {
        setHooks(response.hooks);
        setRoast(response.roast);
        setRoastOriginalHook(request.script);
        setCompareResult(null);
        setCurrentRequest(request);
        setSuccessfulResultId((currentId) => currentId + 1);
        saveEntry(request, response.hooks, response.roast);
      } else {
        setHooks(response.hooks);
        setRoast(null);
        setRoastOriginalHook('');
        setCompareResult(null);
        setCurrentRequest(request);
        setSuccessfulResultId((currentId) => currentId + 1);
        saveEntry(request, response.hooks);
      }
    } catch (caughtError) {
      setHooks([]);
      setRoast(null);
      setCompareResult(null);
      setRoastOriginalHook('');
      handleError(caughtError);
    } finally {
      setIsLoading(false);
    }
  };

  const rewriteCard = async (
    hook: HookResult,
    direction: RewriteDirection,
  ): Promise<void> => {
    setSurfaceError(null);
    setRewritingFramework(hook.framework);

    try {
      const rewritten = await rewriteHook({
        hook: hook.text,
        framework: hook.framework,
        direction,
        platform: resultPlatform,
        hookWindow: currentRequest?.hookWindow ?? hookWindow,
      });

      setPreviousHooks((currentPreviousHooks) => ({
        ...currentPreviousHooks,
        [hook.framework]: currentPreviousHooks[hook.framework] ?? hook,
      }));
      setHooks((currentHooks) =>
        currentHooks.map((currentHook) =>
          currentHook.framework === hook.framework
            ? {
                ...currentHook,
                text: rewritten.text,
                why: rewritten.why,
                scores: rewritten.scores,
                // Drop the old overlay rather than pair it with new wording.
                on_screen_text: rewritten.on_screen_text,
                visual: rewritten.visual,
              }
            : currentHook,
        ),
      );
    } catch (caughtError) {
      handleError(caughtError);
    } finally {
      setRewritingFramework(null);
    }
  };

  const expandSelectedHook = async (
    key: string,
    hookText: string,
    framework: string,
    originalScript: string,
  ): Promise<void> => {
    if (expansionRequests.current.has(key)) return;
    expansionRequests.current.add(key);
    const version = resultVersion.current;
    setExpandingKeys(new Set(expansionRequests.current));
    setExpandErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[key];
      return nextErrors;
    });

    try {
      const response = await expandHook({
        hook: hookText,
        framework,
        platform: resultPlatform,
        originalScript,
        tone: currentRequest?.tone ?? tone,
        audience: currentRequest?.audience ?? audience,
      });

      if (version !== resultVersion.current) return;
      setScriptOutline(response.outline);
      setIsOutlineOpen(true);
    } catch (caughtError) {
      if (version !== resultVersion.current) return;
      const message =
        caughtError instanceof HookLabApiError
          ? caughtError.message
          : 'Something went wrong on our end. Try again.';

      setExpandErrors((currentErrors) => ({
        ...currentErrors,
        [key]: message,
      }));
    } finally {
      if (version === resultVersion.current) {
        expansionRequests.current.delete(key);
        setExpandingKeys(new Set(expansionRequests.current));
      }
    }
  };

  const undoRewrite = (hook: HookResult): void => {
    const previousHook = previousHooks[hook.framework];

    if (!previousHook) {
      return;
    }

    setHooks((currentHooks) =>
      currentHooks.map((currentHook) =>
        currentHook.framework === hook.framework ? previousHook : currentHook,
      ),
    );
    setPreviousHooks((currentPreviousHooks) => {
      const nextPreviousHooks = { ...currentPreviousHooks };

      delete nextPreviousHooks[hook.framework];
      return nextPreviousHooks;
    });
  };

  const restoreHistoryEntry = (entry: HistoryEntry): void => {
    resultVersion.current += 1;
    expansionRequests.current.clear();
    setExpandingKeys(new Set());
    setIsOutlineOpen(false);
    setScript(entry.script);
    setHookB(entry.hookB ?? '');
    setPlatform(entry.platform);
    setTone(entry.tone);
    setAudience(entry.audience);
    setIntensity(entry.intensity);
    setLanguage(entry.language);
    setHookWindow(entry.hookWindow);
    setMode(entry.mode);
    setHooks(entry.hooks ?? []);
    setRoast(entry.roast ?? null);
    setCompareResult(entry.compare ?? null);
    setRoastOriginalHook(entry.roast ? entry.script : '');
    setCurrentRequest({
      script: entry.script,
      hookB: entry.hookB,
      platform: entry.platform,
      tone: entry.tone,
      audience: entry.audience,
      intensity: entry.intensity,
      language: entry.language,
      hookWindow: entry.hookWindow,
      mode: entry.mode,
    });
    setInputError(null);
    setSurfaceError(null);
    setPreviousHooks({});
    setExpandErrors({});
  };

  const selectTemplate = (template: ScriptTemplate): void => {
    setScript(template.script);
    setPlatform(template.defaults.platform);
    setTone(template.defaults.tone);
    setAudience(template.defaults.audience);
    setLanguage(template.defaults.language);
    setHookWindow(template.defaults.hookWindow);
    setMode('generate');
    setInputError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleModeChange = (nextMode: Mode): void => {
    setMode(nextMode);
    setInputError(null);
  };

  const toggleThemePreference = (): void => {
    setThemePreference((currentPreference) => {
      const nextPreference =
        currentPreference === 'night' ? 'default' : 'night';
      try {
        localStorage.setItem('hooklab_theme_preference', nextPreference);
      } catch {
        /* Theme still works for this session. */
      }
      return nextPreference;
    });
  };

  const hasResults = compareResult !== null || sortedHooks.length > 0;
  const modeHints: Record<Mode, string> = {
    generate: 'Paste your script or video idea. You get 10 hook options.',
    roast:
      'Paste a hook you already have. You get a grade, fixes and 10 rewrites.',
    compare: 'Paste two hooks. See which one wins and why.',
  };
  const headerButton =
    'grid h-11 w-11 place-items-center rounded-md border border-white/10 text-muted transition hover:border-cyan/50 hover:text-cyan active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan';

  return (
    <main className="min-h-screen bg-bg text-primary">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 pb-[88px] pt-4 sm:px-6 md:pb-8 md:pt-5 lg:px-8">
        <header className="border-b border-border pb-5 md:pb-6">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-amber">
              HookLab.AI
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLibraryOpen(true)}
                aria-label={`Open saved hooks (${library.savedHooks.length})`}
                title="Saved hooks"
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/10 px-3 text-sm text-muted transition hover:border-cyan/50 hover:text-cyan active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
              >
                <Bookmark size={17} aria-hidden="true" />
                <span className="hidden sm:inline">Saved</span>
                <span className="text-cyan">{library.savedHooks.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                aria-label="Open history"
                title="History"
                className={headerButton}
              >
                <Clock3 size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={toggleThemePreference}
                aria-label={
                  themePreference === 'night'
                    ? 'Use default theme'
                    : 'Use night theme'
                }
                aria-pressed={themePreference === 'night'}
                title="Theme"
                className={headerButton}
              >
                {themePreference === 'night' ? (
                  <Sun size={18} aria-hidden="true" />
                ) : (
                  <Moon size={18} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          <h1 className="mt-5 max-w-3xl font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1] tracking-normal md:mt-6">
            Cut the first few{' '}
            <WordSwap
              words={['seconds', 'hooks', 'frames', 'beats']}
              className="text-amber"
            />{' '}
            before the edit.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-secondary md:text-base">
            Turn your video idea into scroll-stopping opening lines for Shorts,
            Reels and TikTok.
          </p>
        </header>

        <section className="grid flex-1 gap-8 py-6 xl:grid-cols-[minmax(380px,0.8fr)_minmax(0,1.2fr)] xl:gap-10">
          <div className="xl:sticky xl:top-6 xl:self-start">
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void cutHooks();
              }}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  (event.metaKey || event.ctrlKey) &&
                  canSubmit
                ) {
                  event.preventDefault();
                  void cutHooks();
                }
              }}
            >
              <div className="hidden md:block">
                <ModeToggle
                  mode={mode}
                  disabled={isLoading}
                  onChange={handleModeChange}
                />
              </div>
              <div className="space-y-3">
                <p className="text-sm leading-6 text-secondary">
                  {modeHints[mode]}
                  {mode === 'generate' ? (
                    <>
                      {' '}
                      <button
                        type="button"
                        onClick={() => handleModeChange('roast')}
                        className="text-amber underline-offset-4 transition-colors hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
                      >
                        Already have a hook? Roast it.
                      </button>
                    </>
                  ) : null}
                </p>
                <ScriptInput
                  value={script}
                  onChange={setScript}
                  hookB={hookB}
                  onHookBChange={setHookB}
                  language={language}
                  mode={mode}
                  disabled={isLoading}
                />
                {inputError ? (
                  <p className="text-sm text-amber">{inputError}</p>
                ) : null}
                <ExampleChips
                  mode={mode}
                  onLoadScript={(s) => {
                    setScript(s);
                  }}
                  onLoadCompare={(a, b) => {
                    setScript(a);
                    setHookB(b);
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsTemplateSheetOpen(true)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-amber/40 px-3 text-xs text-amber transition hover:border-amber hover:bg-amber/10 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
                  >
                    <Wand2 size={14} aria-hidden="true" />
                    Browse templates
                  </button>
                </ExampleChips>
              </div>
              <PlatformSelector
                selectedPlatform={platform}
                onChange={setPlatform}
                disabled={isLoading}
              />
              <ControlsPanel
                tone={tone}
                audience={audience}
                intensity={intensity}
                language={language}
                hookWindow={hookWindow}
                disabled={isLoading}
                onToneChange={setTone}
                onAudienceChange={setAudience}
                onIntensityChange={setIntensity}
                onLanguageChange={setLanguage}
                onHookWindowChange={setHookWindow}
              />
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-5 py-3 font-display text-base font-semibold text-bg transition hover:brightness-110 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted disabled:active:scale-100 ${
                    mode === 'roast'
                      ? 'bg-red'
                      : mode === 'compare'
                        ? 'bg-cyan'
                        : 'bg-amber'
                  }`}
                >
                  {mode === 'roast' ? (
                    <>
                      <Flame size={18} aria-hidden="true" />
                      Roast My Hook
                    </>
                  ) : mode === 'compare' ? (
                    <>
                      <Scissors size={18} aria-hidden="true" />
                      Compare Hooks
                    </>
                  ) : (
                    <>
                      <Scissors size={18} aria-hidden="true" />
                      Cut 10 Hooks
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-muted">
                  <span className="hidden md:inline">
                    Ctrl/⌘ + Enter to run ·{' '}
                  </span>
                  Your draft is saved in this browser
                </p>
              </div>
            </form>
          </div>

          <section aria-live="polite" aria-busy={isLoading}>
            <div className="mb-4 flex min-h-11 items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-primary">
                  {compareResult ? 'Comparison' : 'Your hooks'}
                </h2>
                <p className="text-xs text-muted">
                  {isLoading
                    ? mode === 'roast'
                      ? 'Roasting your hook…'
                      : mode === 'compare'
                        ? 'Comparing your hooks…'
                        : 'Writing 10 hooks…'
                    : compareResult
                      ? 'Winner picked'
                      : hooks.length > 0
                        ? `${hooks.length} options · best pick first · scores are AI estimates, not view predictions`
                        : 'Results appear here'}
                </p>
              </div>
              {!isLoading && hasResults && currentRequest ? (
                <ExportBar
                  hooks={compareResult ? [] : sortedHooks}
                  request={currentRequest}
                  roast={compareResult ? undefined : (roast ?? undefined)}
                  compare={compareResult ?? undefined}
                />
              ) : null}
            </div>

            {surfaceError ? (
              <div
                role="alert"
                className="mb-5 rounded-md border border-amber/35 bg-amber/10 px-4 py-3 font-mono text-sm text-amber"
              >
                {surfaceError}
              </div>
            ) : null}
            {library.error ? (
              <p role="alert" className="mb-4 text-sm text-amber">
                {library.error}
              </p>
            ) : null}

            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {skeletonItems.map((item) => (
                  <SkeletonCard key={item} />
                ))}
              </div>
            ) : compareResult ? (
              <div
                ref={resultsRef}
                className="scroll-mt-24 space-y-4 md:scroll-mt-0"
              >
                <CompareCard
                  compare={compareResult}
                  hookA={resultHookA}
                  hookB={resultHookB}
                  platform={resultPlatform}
                  winnerSaved={library.isSaved(winnerHook, resultPlatform)}
                  improvedSaved={library.isSaved(
                    compareResult.improvedHook,
                    resultPlatform,
                  )}
                  onSaveWinner={() =>
                    library.toggle(winnerHook, 'COMPARE WINNER', resultPlatform)
                  }
                  onSaveImproved={() =>
                    library.toggle(
                      compareResult.improvedHook,
                      'IMPROVED HOOK',
                      resultPlatform,
                    )
                  }
                  isExpandingWinner={expandingKeys.has('compare-winner')}
                  expandError={expandErrors['compare-winner']}
                  onExpandWinner={() => {
                    const originalContext = winnerHook;

                    void expandSelectedHook(
                      'compare-winner',
                      winnerHook,
                      `COMPARE WINNER ${compareResult.winner}`,
                      originalContext,
                    );
                  }}
                />
              </div>
            ) : sortedHooks.length > 0 ? (
              <div
                ref={resultsRef}
                className="scroll-mt-24 space-y-4 md:scroll-mt-0"
              >
                {roast ? (
                  <RoastCard roast={roast} originalHook={roastOriginalHook} />
                ) : null}
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {sortedHooks.map((hook, index) => (
                    <HookCard
                      key={hook.framework}
                      hook={hook}
                      index={index}
                      platform={resultPlatform}
                      hookWindow={currentRequest?.hookWindow ?? hookWindow}
                      saved={library.isSaved(hook.text, resultPlatform)}
                      onSave={() =>
                        library.toggle(
                          hook.text,
                          hook.framework,
                          resultPlatform,
                        )
                      }
                      canUndo={Boolean(previousHooks[hook.framework])}
                      isRewriting={rewritingFramework === hook.framework}
                      isExpanding={expandingKeys.has(hook.framework)}
                      expandError={expandErrors[hook.framework]}
                      onRewrite={(direction) => {
                        void rewriteCard(hook, direction);
                      }}
                      onUndo={() => undoRewrite(hook)}
                      onExpand={() => {
                        void expandSelectedHook(
                          hook.framework,
                          hook.text,
                          hook.framework,
                          currentRequest?.script ?? script,
                        );
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : sharedHook ? (
              <SharedHookCard
                hook={sharedHook}
                onRoast={() => {
                  setScript(sharedHook.text);
                  setPlatform(sharedHook.platform);
                  setMode('roast');
                  setInputError(null);
                  setSharedHook(null);
                }}
                onDismiss={() => setSharedHook(null)}
              />
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 px-6 py-10 text-center">
                  <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-tr from-red/10 to-amber/10">
                    <Scissors
                      className="h-7 w-7 text-amber"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-primary">
                    Ready when you are
                  </h3>
                  <p className="max-w-sm text-sm leading-6 text-muted">
                    Paste your script, try an example, or browse templates. Your
                    hooks will show up here.
                  </p>
                </div>
                <ComparisonSection />
              </div>
            )}
          </section>
        </section>
      </div>

      <BottomTabBar
        mode={mode}
        disabled={isLoading}
        onChange={handleModeChange}
      />

      <TemplateSheet
        isOpen={isTemplateSheetOpen}
        onClose={() => setIsTemplateSheetOpen(false)}
        onSelect={selectTemplate}
        disabled={isLoading}
      />

      <BackToTop />
      <SavedHooksDrawer
        isOpen={isLibraryOpen}
        hooks={library.savedHooks}
        error={library.error}
        onClose={closeLibrary}
        onRemove={library.remove}
        onLabels={library.setLabels}
        onUse={(hook) => {
          setScript(hook.text);
          setPlatform(hook.platform);
          setMode('roast');
          setInputError(null);
          setIsLibraryOpen(false);
          window.scrollTo({
            top: 0,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
              .matches
              ? 'auto'
              : 'smooth',
          });
        }}
        onCompare={(first, second) => {
          setScript(first.text);
          setHookB(second.text);
          setPlatform(first.platform);
          setMode('compare');
          setInputError(null);
          setIsLibraryOpen(false);
          window.scrollTo({
            top: 0,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
              .matches
              ? 'auto'
              : 'smooth',
          });
        }}
      />

      <ScriptOutline
        isOpen={isOutlineOpen}
        outline={scriptOutline}
        onClose={closeOutline}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        entries={entries}
        onClose={() => setIsHistoryOpen(false)}
        onRestore={restoreHistoryEntry}
        onDelete={deleteEntry}
        onClear={clearEntries}
      />
    </main>
  );
}

export default App;
