import { defineConfig } from "tsup"

export default defineConfig((options) => ({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  // Don't wipe dist in watch mode: the API and web dev servers load it while core
  // rebuilds, and an empty dist crashes them on startup.
  clean: !options.watch,
  target: "es2022",
}))
