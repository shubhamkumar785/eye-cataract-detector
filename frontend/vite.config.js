import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("recharts")) {
              return "charts-vendor";
            }

            if (
              id.includes("lucide-react")
              || id.includes("react-hot-toast")
              || id.includes("react-dropzone")
            ) {
              return "ui-vendor";
            }

            if (id.includes("axios")) {
              return "http-vendor";
            }

            if (id.includes("jspdf")) {
              return "jspdf-vendor";
            }

            if (id.includes("html2canvas")) {
              return "canvas-vendor";
            }

            return "vendor";
          }
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
});
