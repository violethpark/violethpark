// Lives in its own package because typescript-eslint supports TypeScript 6
// at most; the root's TypeScript 7 still does all type checking. Follows
// violethpark/workspace .devcontainer/config/lint/eslint.config.ts.
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

// convert.ts inlines String(fn) of each function in page.ts into the page,
// where the function cannot see the module's imports or other top-level
// names; tsc does not see that. Types are erased by Node, so type-only
// imports and type declarations may stay.
const inlined =
  "page.ts: convert.ts inlines each function's source into the page with String(fn), so it cannot see imports or other top-level names";

export default defineConfig(
  // The Python venv for the fonts and their checks vendors JavaScript.
  globalIgnores([".venv-fonts/"]),
  {
    files: ["**/*.ts"],
    ignores: ["**/node_modules/**"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    linterOptions: { reportUnusedDisableDirectives: "error" },
  },
  {
    files: ["page.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program > ImportDeclaration[importKind!='type']",
          message: `${inlined}; import types with \`import type\` only.`,
        },
        {
          selector:
            "Program > ExportNamedDeclaration[exportKind!='type'][declaration=null]",
          message: `${inlined}; export values only as \`export function\`.`,
        },
        {
          selector:
            "Program > ExportNamedDeclaration > .declaration:not(FunctionDeclaration, TSTypeAliasDeclaration, TSInterfaceDeclaration)",
          message: `${inlined}; export only functions and types.`,
        },
        {
          selector:
            "Program > :not(ImportDeclaration, ExportNamedDeclaration, ExportAllDeclaration[exportKind='type'], TSTypeAliasDeclaration, TSInterfaceDeclaration)",
          message: `${inlined}; keep only \`export function\` and type declarations at the top level.`,
        },
      ],
    },
  },
);
