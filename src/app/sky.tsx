// Decorative pixel clouds behind the page content.
function Cloud({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 16 8" shapeRendering="crispEdges" className={`absolute ${className}`} aria-hidden>
      <path fill="var(--color-cloud)" d="M5 1h4v1h2v1h2v1h1v1h1v2H0V5h1V4h1V3h2V2h1z" />
      <path fill="var(--color-sky-light)" d="M1 6h14v1H1z" />
    </svg>
  );
}

export function Sky() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <Cloud className="top-[12%] left-[-4%] w-32 opacity-90" />
      <Cloud className="top-[38%] right-[-6%] w-40 opacity-80" />
      <Cloud className="top-[70%] left-[8%] w-24 opacity-70" />
    </div>
  );
}
