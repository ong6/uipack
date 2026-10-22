// Lint for correctness only: the rules of hooks (react-hooks' recommended set, with the React Compiler
// checks: no ref read or written during render, no props or globals mutated, no synchronous setState
// in an effect), unhandled promises and unused code. Formatting is Prettier's job, not ESLint's
// (docs/contributing.md, Formatting).
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
      ...reactHooks.configs.flat["recommended-latest"].rules,
      // useIsoLayoutEffect (src/env.ts) is useLayoutEffect in the browser: check its deps the same way.
      "react-hooks/exhaustive-deps": ["warn", { additionalHooks: "^useIsoLayoutEffect$" }],
      // From recommended-type-checked: a promise is awaited, returned, or explicitly `void`ed.
      "@typescript-eslint/no-floating-promises": "error",
      // An async function is never passed where a void callback is expected (handlers, effects).
      "@typescript-eslint/no-misused-promises": "error",
      // Unused code goes; a leading underscore marks a parameter or binding kept for its position.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    // Files another change owns at the moment; their findings are queued for a follow-up rather than
    // switched off for good. Each line names the rule and the file it is off for, nothing wider.
    files: ["src/deck/DeckPlayer.tsx", "src/deck/player/Overview.tsx", "src/deck/player/Print.tsx"],
    rules: { "react-hooks/refs": "off" },
  },
  {
    files: ["src/slides/SlidePlayer.tsx"],
    rules: { "react-hooks/refs": "off", "react-hooks/set-state-in-effect": "off" },
  },
  {
    files: ["playground/WebShowcase.tsx"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
];
