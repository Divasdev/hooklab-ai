export function SkeletonCard() {
  return (
    <article
      aria-hidden="true"
      className="min-h-[270px] rounded-md border border-white/10 bg-surface p-5 shadow-panel"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="h-3 w-32 rounded-[3px] bg-amber/30 motion-safe:animate-skeletonPulse" />
          <div className="h-6 w-24 rounded-[3px] bg-white/10 motion-safe:animate-skeletonPulse" />
        </div>
        <div className="h-10 w-10 rounded-[4px] border border-white/10 bg-white/5 motion-safe:animate-skeletonPulse" />
      </div>
      <div className="mt-9 space-y-3">
        <div className="h-8 w-11/12 rounded-[3px] bg-white/10 motion-safe:animate-skeletonPulse" />
        <div className="h-8 w-4/5 rounded-[3px] bg-white/10 motion-safe:animate-skeletonPulse" />
        <div className="h-8 w-7/12 rounded-[3px] bg-white/10 motion-safe:animate-skeletonPulse" />
      </div>
      <div className="mt-10 h-16 rounded-[3px] border-b border-cyan/20 bg-cyan/5 motion-safe:animate-skeletonPulse" />
    </article>
  );
}
