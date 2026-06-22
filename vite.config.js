// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // This exposes the app to your local network
    port: 3001, // Kept it 3001 since that is what you were using
  },
});
