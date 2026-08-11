import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => ({
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
      babel: {
        plugins: ["@emotion/babel-plugin"],
      },
    }),
    tsconfigPaths(),
  ],
  // Use relative base for flexibility (works in all environments)
  base: "./",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: "./src/widget.tsx", // Build from widget.tsx entry point
      output: {
        entryFileNames: "main.js", // Predictable output filename (not hashed)
        assetFileNames: (assetInfo) => {
          if (
            assetInfo.name &&
            assetInfo.name.match(
              /\.(riv|png|jpe?g|gif|svg|ico|webp|mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i,
            )
          ) {
            return "assets/[name][extname]";
          }
          // CSS should be bundled into JS via emotion, but fallback
          if (assetInfo.name && assetInfo.name.match(/\.css$/i)) {
            return "styles/[name][extname]";
          }
          return "[name][extname]";
        },
        // No code splitting - single main.js file
        inlineDynamicImports: true,
      },
    },
    // Don't split CSS - let Emotion handle it inline
    cssCodeSplit: false,
    // Minify for production
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: false,
      },
    },
  },
  define: {
    "process.env": {},
  },
  assetsInclude: ["**/*.riv"],
  // Dev server configuration (for local development)
  server: {
    port: 3000,
    open: true,
  },
}));
