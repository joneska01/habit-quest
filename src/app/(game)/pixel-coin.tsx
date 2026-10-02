// Original 8-bit arcade coin (10×14 pixel grid): gold oval, ink outline, cream
// highlight, darker rim and center stripe. Drawn as SVG rects so it stays crisp.
const COIN = [
  "...KKKK...",
  "..KYYYYK..",
  ".KYWYYYOK.",
  ".KYWYOYOK.",
  "KYWYYOYYOK",
  "KYWYYOYYOK",
  "KYWYYOYYOK",
  "KYWYYOYYOK",
  "KYYYYOYYOK",
  "KYYYYOYYOK",
  ".KYYYOYOK.",
  ".KYYYYYOK.",
  "..KOOOOK..",
  "...KKKK...",
];
const FILL: Record<string, string> = {
  K: "var(--color-ink)",
  Y: "var(--color-coin)",
  O: "#c98a00",
  W: "var(--color-cream)",
};

export function PixelCoin({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 14" shapeRendering="crispEdges" className={className} aria-hidden>
      {COIN.flatMap((row, y) =>
        [...row].flatMap((c, x) => (FILL[c] ? [<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={FILL[c]} />] : [])),
      )}
    </svg>
  );
}
