import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const basePath = (
  globalThis as {
    process?: {
      env?: Record<string, string | undefined>;
    };
  }
).process?.env?.BASE_PATH;

export default defineConfig({
  fmt: {
    ignorePatterns: ["public/data/**"],
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  test: {
    passWithNoTests: true,
  },
  base: basePath ?? "/",
  plugins: [react(), tailwindcss()],
});
