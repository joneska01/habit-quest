import { ImageResponse } from "next/og";

// Original 8-bit art: a gold star over sky, clouds and grass (20×20 "pixel" grid).
// Kept inside the central ~80% so Android's maskable crop never clips it.
const STAR = [
  "......KK......",
  ".....KYYK.....",
  ".....KWYK.....",
  "....KYWYYK....",
  "KKKKKYYYYKKKKK",
  "KYYYYYYYYYYYYK",
  ".KYYYYYYYYYYK.",
  "..KYYYYYYYYK..",
  "...KYYYYYYK...",
  "...KYYYYYYK...",
  "..KYYYKKYYYK..",
  "..KYYK..KYYK..",
  ".KYYK....KYYK.",
  ".KKK......KKK.",
];
const COLORS: Record<string, string> = { K: "#2b2d42", Y: "#ffc93c", W: "#fff8e7" };
const OFFSET = { x: 3, y: 1 };

export function pixelIcon(size: number) {
  const pixels = STAR.flatMap((row, y) =>
    [...row].flatMap((c, x) =>
      COLORS[c] ? [<rect key={`${x}-${y}`} x={x + OFFSET.x} y={y + OFFSET.y} width={1} height={1} fill={COLORS[c]} />] : [],
    ),
  );

  return new ImageResponse(
    (
      <svg width={size} height={size} viewBox="0 0 20 20" shapeRendering="crispEdges">
        <rect width={20} height={20} fill="#6ec6ff" />
        <rect x={0} y={3} width={3} height={1} fill="#ffffff" />
        <rect x={1} y={2} width={1} height={1} fill="#ffffff" />
        <rect x={17} y={7} width={3} height={1} fill="#ffffff" />
        <rect x={18} y={6} width={1} height={1} fill="#ffffff" />
        <rect x={0} y={16} width={20} height={2} fill="#4cc552" />
        <rect x={0} y={18} width={20} height={2} fill="#c8763a" />
        {pixels}
      </svg>
    ),
    { width: size, height: size },
  );
}
