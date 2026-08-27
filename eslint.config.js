import eslint from "@eslint/js";
import { importX } from "eslint-plugin-import-x";
import jsdocPlugin, { configs as jsdocConfigs } from "eslint-plugin-jsdoc";
import node from "eslint-plugin-n";
import promise from "eslint-plugin-promise";
import security from "eslint-plugin-security";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import globals from "globals";

const JAVASCRIPT_FILES = ["**/*.{js,mjs,cjs}"];
const SOURCE_FILES = ["src/**/*.js"];
const NODE_FILES = ["scripts/**/*.mjs", "*.config.js"];

const correctnessRules = {
  ...eslint.configs.recommended.rules,
  ...importX.flatConfigs.recommended.rules,
  ...promise.configs["flat/recommended"].rules,
  ...security.configs.recommended.rules,
  ...sonarjs.configs.recommended.rules,
  ...unicorn.configs.recommended.rules,
  "array-callback-return": "error",
  "arrow-body-style": ["error", "as-needed"],
  curly: ["error", "all"],
  eqeqeq: ["error", "always"],
  "no-alert": "error",
  "no-await-in-loop": "error",
  "no-console": ["error", { allow: ["warn", "error"] }],
  "no-debugger": "error",
  "no-duplicate-imports": "off",
  "no-floating-decimal": "error",
  "no-implicit-coercion": "error",
  "no-multi-assign": "error",
  "no-nested-ternary": "error",
  "no-param-reassign": ["error", { props: true }],
  "no-promise-executor-return": "error",
  "no-return-assign": "error",
  "no-shadow": "error",
  "no-throw-literal": "error",
  "no-unneeded-ternary": "error",
  "no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
      caughtErrors: "all",
      caughtErrorsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
    },
  ],
  "no-use-before-define": ["error", { classes: true, functions: false, variables: true }],
  "no-useless-concat": "error",
  "no-useless-return": "error",
  "no-var": "error",
  "object-shorthand": ["error", "always"],
  "prefer-arrow-callback": "error",
  "prefer-const": "error",
  "prefer-promise-reject-errors": "error",
  "prefer-template": "error",
  "require-atomic-updates": "error",
  "require-await": "error",
  "import-x/first": "error",
  "import-x/newline-after-import": "error",
  "import-x/no-cycle": ["error", { ignoreExternal: true, maxDepth: 8 }],
  "import-x/no-duplicates": "error",
  "import-x/no-self-import": "error",
  "import-x/no-useless-path-segments": "error",
  "import-x/order": [
    "error",
    {
      alphabetize: { caseInsensitive: true, order: "asc" },
      groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
      "newlines-between": "always",
    },
  ],
  "promise/no-multiple-resolved": "error",
  "promise/no-nesting": "error",
  "security/detect-object-injection": "off",
  "unicorn/consistent-class-member-order": "off",
  "unicorn/max-nested-calls": "off",
  "unicorn/prefer-iterator-to-array": "off",
  "unicorn/prefer-scoped-selector": "off",
  "unicorn/prefer-simple-condition-first": "off",
  "unicorn/filename-case": [
    "error",
    {
      case: "pascalCase",
      checkDirectories: false,
      ignore: [/^(eslint|stylelint|vite)\.config\.js$/],
    },
  ],
  "unicorn/no-null": "off",
  "unicorn/name-replacements": [
    "error",
    {
      extendDefaultAllowList: true,
      allowList: {
        args: true,
        attrs: true,
        ctx: true,
        env: true,
        params: true,
        props: true,
        ref: true,
        refs: true,
        svg: true,
      },
    },
  ],
};

const maintainabilityRules = {
  complexity: ["error", 12],
  "max-depth": ["error", 3],
  "max-lines": ["error", { max: 500, skipBlankLines: true, skipComments: true }],
  "max-lines-per-function": ["error", { max: 90, skipBlankLines: true, skipComments: true }],
  "max-nested-callbacks": ["error", 3],
  "max-params": ["error", 3],
  "max-statements": ["error", 30],
  "sonarjs/cognitive-complexity": ["error", 15],
  "sonarjs/no-duplicate-string": ["error", { threshold: 3 }],
};

const jsdocRules = {
  ...jsdocConfigs["flat/recommended-error"].rules,
  "jsdoc/informative-docs": "error",
  "jsdoc/multiline-blocks": ["error", { noSingleLineBlocks: true }],
  "jsdoc/no-defaults": "off",
  "jsdoc/require-description": "error",
  "jsdoc/require-description-complete-sentence": "error",
  "jsdoc/require-hyphen-before-param-description": "error",
  "jsdoc/require-jsdoc": [
    "error",
    {
      contexts: ["FunctionDeclaration", "MethodDefinition", "Property[method=true]"],
    },
  ],
  "jsdoc/require-param-description": "error",
  "jsdoc/require-returns-description": "error",
  "jsdoc/tag-lines": ["error", "never", { startLines: 1 }],
};

export default [
  {
    ignores: ["coverage/**", "dist/**", "node_modules/**", "vendor/**", ".vitest-attachments/**"],
  },
  {
    files: JAVASCRIPT_FILES,
    languageOptions: {
      ecmaVersion: "latest",
      globals: { ...globals.browser, ...globals.node },
      sourceType: "module",
    },
    linterOptions: { reportUnusedDisableDirectives: "error" },
    plugins: {
      "import-x": importX,
      n: node,
      promise,
      security,
      sonarjs,
      unicorn,
    },
    rules: correctnessRules,
  },
  {
    files: SOURCE_FILES,
    plugins: { jsdoc: jsdocPlugin },
    rules: { ...maintainabilityRules, ...jsdocRules },
    settings: { jsdoc: { mode: "typescript" } },
  },
  {
    files: NODE_FILES,
    rules: {
      ...node.configs["flat/recommended-module"].rules,
      "n/no-missing-import": "error",
      "n/no-process-exit": "error",
      "n/no-unpublished-import": "off",
      "n/prefer-node-protocol": "error",
      "no-console": ["error", { allow: ["error", "log", "warn"] }],
      "security/detect-non-literal-fs-filename": "off",
    },
  },
  {
    files: ["demo/Main.js"],
    rules: {
      "sonarjs/pseudo-random": "off",
      "unicorn/no-top-level-side-effects": "off",
    },
  },
];
