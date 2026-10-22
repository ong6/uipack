// Lint for the rules of hooks only; formatting and style are the house format's job (docs/contributing.md).
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist/", "node_modules/", "playwright-report/", "test-results/", "src/mechanism/kit/"] },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { "react-hooks": reactHooks },
    linterOptions: { reportUnusedDisableDirectives: "warn" },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      // useIsoLayoutEffect (src/env.ts) is useLayoutEffect in the browser: check its deps the same way.
      "react-hooks/exhaustive-deps": ["warn", { additionalHooks: "^useIsoLayoutEffect$" }],
    },
  },
];
