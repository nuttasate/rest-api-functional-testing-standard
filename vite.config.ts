import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset paths prevent 404s when the site is hosted under a subpath (e.g. GitHub Pages).
  base: "./",
});