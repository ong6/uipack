// Lint for correctness only: the rules of hooks, unhandled promises and unused code. Formatting is
// Prettier's job, not ESLint's (docs/contributing.md, Formatting).
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist/", "node_modules/", "playwright-report/", "test-results/", "src/mechanism/kit/"] },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        // Type information for the promise rules. Root config files sit outside tsconfig.json's include.
        projectService: { allowDefaultProject: ["*.ts"] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { "react-hooks": reactHooks, "@typescript-eslint": tseslint.plugin },
    linterOptions: { reportUnusedDisableDirectives: "warn" },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      // useIsoLayoutEffect (src/env.ts) is useLayoutEffect in the browser: check its deps the same way.
      "react-hooks/exhaustive-deps": ["warn", { additionalHooks: "^useIsoLayoutEffect$" }],
      // From recommended-type-checked: a promise is awaited, returned, or explicitly `void`ed.
      "@typescript-eslint/no-floating-promises": "error",
      // Unused code goes; a leading underscore marks a parameter or binding kept for its position.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" },
      ],
    },
  },
];
