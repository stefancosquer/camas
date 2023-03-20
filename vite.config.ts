import { defineConfig, PluginOption } from "vite";
import react from "@vitejs/plugin-react";

const allowDotInPath = (): PluginOption => ({
  name: "allow-dot-in-path",
  configureServer(server) {
    return () => {
      server.middlewares.use((req, res, next) => {
        if (req["url"].includes(".") && !req["url"].endsWith(".html")) {
          req["url"] = "/index.html";
        }
        next();
      });
    };
  },
});

export default defineConfig({
  plugins: [react(), allowDotInPath()],
});
