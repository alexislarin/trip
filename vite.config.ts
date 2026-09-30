import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  // `configure-pages` supplies the right value for each GitHub Pages site.
  // Local development and custom domains default to the root path.
  // Vite substitutes %BASE_URL% verbatim in index.html, so retain the trailing
  // slash even when configure-pages supplies `/trip`.
  base: (process.env.VITE_BASE_PATH ?? "/").replace(/\/?$/, "/"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
