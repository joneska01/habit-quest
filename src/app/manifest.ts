import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Habit Quest",
    short_name: "Habit Quest",
    description: "Level up your daily habits.",
    start_url: "/",
    display: "standalone",
    background_color: "#6ec6ff",
    theme_color: "#6ec6ff",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
