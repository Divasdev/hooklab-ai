import { useEffect, useRef, useState } from 'react';

import type { HookScores } from '../types/hooks';

interface GradeBreakdownProps {
  scores: HookScores;
}

const scoreItems: Array<{ key: keyof HookScores; label: string }> = [
  { key: 'curiosity', label: 'Curiosity' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'scroll_stop', label: 'Scroll Stop' },
  { key: 'platform_fit', label: 'Platform Fit' },
];

export function GradeBreakdown({ scores }: GradeBreakdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReducedMotion) {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="grid gap-3 sm:grid-cols-2">
      {scoreItems.map((item, index) => {
        const value = scores[item.key];

        return (
          <div key={item.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.12em]">
              <span className="text-muted">{item.label}</span>
              <AnimatedNumber value={value} isRevealed={isRevealed} delay={index * 80} />
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-cyan/20">
              <div
                className="h-full rounded-full bg-cyan score-bar-animated"
                style={{
                  width: isRevealed ? `${value}%` : '0%',
                  transitionDelay: `${index * 80}ms`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface AnimatedNumberProps {
  value: number;
  isRevealed: boolean;
  delay: number;
}

function AnimatedNumber({ value, isRevealed, delay }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRevealed) {
      setDisplayValue(0);
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const delayTimeout = setTimeout(() => {
      const duration = 700;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * value);

        setDisplayValue(current);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(delayTimeout);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRevealed, value, delay]);

  return <span className="text-cyan">{displayValue}</span>;
}
