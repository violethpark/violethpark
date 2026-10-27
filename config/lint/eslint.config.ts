// Lives in its own package because typescript-eslint supports TypeScript 6
// at most; the root's TypeScript 7 still does all type checking. Follows
// violethpark/workspace .devcontainer/config/lint/eslint.config.ts.
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  // The Python venv for the fonts and their checks vendors JavaScript.
  globalIgnores([".venv-fonts/"]),
  {
    files: ["**/*.ts"],
    ignores: ["**/node_modules/**"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    linterOptions: { reportUnusedDisableDirectives: "error" },
  },
);
