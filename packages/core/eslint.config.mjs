import { defineConfig, globalIgnores } from "eslint/config"
import tseslint from "typescript-eslint"

export default defineConfig([
  ...tseslint.configs.recommended,
  // Clean architecture: business rules must not depend on frameworks, databases or crypto.
  {
    files: ["src/**/*.ts"],
    ignores: ["src/**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "next",
                "next/*",
                "react",
                "react-dom",
                "express",
                "ws",
                "pg",
                "drizzle-orm",
                "drizzle-orm/*",
                "@neondatabase/*",
                "jose",
                "bcryptjs",
              ],
              message: "@ndutas/core must stay free of frameworks and adapters.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores(["dist/**"]),
])
