import { pixelIcon } from "./pixel-icon";

export const contentType = "image/png";

// Browser tab (32) + Android / install sizes (192, 512) used by the manifest.
export function generateImageMetadata() {
  return [32, 192, 512].map((px) => ({ id: String(px), size: { width: px, height: px }, contentType }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  return pixelIcon(Number(await id));
}
