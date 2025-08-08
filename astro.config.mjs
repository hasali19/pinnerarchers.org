// @ts-check
import { defineConfig } from "astro/config";
import compressor from "astro-compressor";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [compressor()],
  vite: {
    // @ts-expect-error
    plugins: [tailwindcss()],
    server: {
      proxy: {
        "/calendar.ics": {
          target: "https://calendar.google.com",
          changeOrigin: true,
          rewrite: () => process.env.PA_CALENDAR_PATH ?? "",
        },
      },
    },
  },
});
