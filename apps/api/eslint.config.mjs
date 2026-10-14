import { defineConfig } from "eslint/config"
import tseslint from "typescript-eslint"

export default defineConfig([
  ...tseslint.configs.recommended,
  {
    rules: {
      // `_name` marks a value left unused on purpose (omitted columns, Express's 4-arg error handler).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" },
      ],
    },
  },
])
