import { useEffect, useRef, type ReactNode } from 'react';

interface RevealProps {
  open: boolean;
  id?: string;
  children: ReactNode;
}

// Animates height open/closed; closed content is inert so it can't be tabbed into.
export function Reveal({ open, id, children }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.inert = !open;
    }
  }, [open]);

  return (
    <div
      ref={ref}
      id={id}
      className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${
        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      }`}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
