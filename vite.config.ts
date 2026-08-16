import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { beastOctane } from "beast-tsrx/vite";
import path from "path";

export default defineConfig({
  plugins: [tailwindcss(), beastOctane()],
  appType: "spa",
  resolve: {
    alias: {
      "@": path.resolve("./src"),
    },
  },
});
