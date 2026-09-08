import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  build: { outDir: "dist/webview", emptyOutDir: false, rollupOptions: { output: { entryFileNames: "assets/app.js", assetFileNames: "assets/[name][extname]" } } }
})
