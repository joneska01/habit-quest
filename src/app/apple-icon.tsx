import { pixelIcon } from "./pixel-icon";

// iPhone "Add to Home Screen" icon. iOS rounds the corners itself.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return pixelIcon(size.width);
}
