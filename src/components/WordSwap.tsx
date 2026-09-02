import { useEffect, useState } from 'react';

interface WordSwapProps {
  words: string[];
  interval?: number;
  className?: string;
}

export function WordSwap({
  words,
  interval = 2800,
  className = '',
}: WordSwapProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReducedMotion || words.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setIsAnimating(true);

      // After exit animation completes, swap the word
      const swapTimeout = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setIsAnimating(false);
      }, 320);

      return () => clearTimeout(swapTimeout);
    }, interval);

    return () => clearInterval(timer);
  }, [words, interval]);

  return (
    <span
      className={`word-swap-container ${className}`}
      aria-label={words.join(', ')}
    >
      <span
        className={`word-swap-text ${isAnimating ? 'word-swap-exit' : 'word-swap-enter'}`}
        aria-live="polite"
      >
        {words[currentIndex]}
      </span>
    </span>
  );
}
