import eslint from "@eslint/js";
import vitest from "@vitest/eslint-plugin";
import { importX } from "eslint-plugin-import-x";
import jsdocPlugin, { configs as jsdocConfigs } from "eslint-plugin-jsdoc";
import node from "eslint-plugin-n";
import promise from "eslint-plugin-promise";
import security from "eslint-plugin-security";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import globals from "globals";

import { maxTestLines } from "./scripts/TestLintRules.mjs";

const JAVASCRIPT_FILES = [
  "**/*.{js,mjs,cjs}",
];
const SOURCE_FILES = [
  "src/**/*.js",
];
const NODE_FILES = [
  "scripts/**/*.mjs",
  "*.config.js",
];
const MAX_CONSECUTIVE_DECLARATIONS = 8;
const MINIMUM_MULTILINE_ARRAY_ITEMS = 3;
const MINIMUM_MULTILINE_RETURN_PROPERTIES = 2;
const declarationSequence = Array.from(
  { length: MAX_CONSECUTIVE_DECLARATIONS + 1 },
  () => "VariableDeclaration",
).join(" + ");
const declarationWallSelector = `:matches(FunctionDeclaration, FunctionExpression, ArrowFunctionExpression) BlockStatement > ${declarationSequence}`;

function hasOneItemPerLine(sourceCode, containerNode, items) {
  const boundaryTokens = [
    sourceCode.getFirstToken(containerNode),
    ...items,
    sourceCode.getLastToken(containerNode),
  ];

  return boundaryTokens.every((token, index) => {
    const previousToken = boundaryTokens[index - 1];

    return previousToken === undefined || previousToken.loc.end.line < token.loc.start.line;
  });
}

function multilineContainerFixes(fixer, sourceCode, containerNode, items) {
  const openingToken = sourceCode.getFirstToken(containerNode);
  const closingToken = sourceCode.getLastToken(containerNode);
  const fixes = [];

  if (openingToken.loc.end.line === items[0].loc.start.line) {
    fixes.push(fixer.insertTextAfter(openingToken, "\n"));
  }

  for (let index = 1; index < items.length; index += 1) {
    const previousItem = items[index - 1];
    const item = items[index];

    if (previousItem.loc.end.line === item.loc.start.line) {
      fixes.push(fixer.insertTextBefore(item, "\n"));
    }
  }

  if (items.at(-1).loc.end.line === closingToken.loc.start.line) {
    fixes.push(fixer.insertTextBefore(closingToken, "\n"));
  }

  return fixes;
}

const multilineArrayRule = {
  meta: {
    type: "layout",
    docs: { description: "Require arrays with three or more elements to use one line per element." },
    messages: { multiline: "Arrays with three or more elements must place each element on its own line." },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      ArrayExpression(arrayNode) {
        const elements = arrayNode.elements.filter(Boolean);

        if (elements.length < MINIMUM_MULTILINE_ARRAY_ITEMS) {
          return;
        }

        if (!hasOneItemPerLine(sourceCode, arrayNode, elements)) {
          context.report({ messageId: "multiline", node: arrayNode });
        }
      },
    };
  },
};

const multilineReturnObjectRule = {
  meta: {
    type: "layout",
    docs: {
      description: "Require returned objects with two or more properties to use one line per property.",
    },
    messages: {
      multiline: "Returned objects with two or more properties must place each property on its own line.",
    },
    fixable: "whitespace",
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      ReturnStatement(returnNode) {
        const objectNode = returnNode.argument;

        if (objectNode?.type !== "ObjectExpression") {
          return;
        }

        if (objectNode.properties.length < MINIMUM_MULTILINE_RETURN_PROPERTIES) {
          return;
        }

        if (!hasOneItemPerLine(sourceCode, objectNode, objectNode.properties)) {
          context.report({
            fix: (fixer) => multilineContainerFixes(fixer, sourceCode, objectNode, objectNode.properties),
            messageId: "multiline",
            node: objectNode,
          });
        }
      },
    };
  },
};

const orchidChartsPlugin = {
  rules: {
    "multiline-array": multilineArrayRule,
    "max-test-lines": maxTestLines,
    "multiline-return-object": multilineReturnObjectRule,
  },
};

const correctnessRules = {
  ...eslint.configs.recommended.rules,
  ...importX.flatConfigs.recommended.rules,
  ...promise.configs["flat/recommended"].rules,
  ...security.configs.recommended.rules,
  ...sonarjs.configs.recommended.rules,
  ...unicorn.configs.recommended.rules,
  "array-callback-return": "error",
  "arrow-body-style": [
    "error",
    "as-needed",
  ],
  curly: [
    "error",
    "all",
  ],
  eqeqeq: [
    "error",
    "always",
  ],
  "no-alert": "error",
  "no-await-in-loop": "error",
  "no-console": [
    "error",
    {
      allow: [
        "warn",
        "error",
      ],
    },
  ],
  "no-debugger": "error",
  "no-duplicate-imports": "off",
  "no-floating-decimal": "error",
  "no-implicit-coercion": "error",
  "no-multi-assign": "error",
  "no-nested-ternary": "error",
  "no-param-reassign": [
    "error",
    { props: true },
  ],
  "no-promise-executor-return": "error",
  "no-return-assign": "error",
  "no-restricted-syntax": [
    "error",
    {
      selector: "IfStatement[alternate]",
      message: "Do not use else or else-if. Use guard clauses, early returns, or an explicit strategy.",
    },
    {
      selector: "ConditionalExpression > LogicalExpression",
      message:
        "Do not combine ternary expressions with logical or nullish expressions. Extract a named decision.",
    },
    {
      selector: declarationWallSelector,
      message: `Do not declare more than ${MAX_CONSECUTIVE_DECLARATIONS} local variables in sequence. Extract a named calculation or policy.`,
    },
    {
      selector:
        ":matches(FunctionDeclaration, FunctionExpression, ArrowFunctionExpression) > ObjectPattern.params[properties.length>4]",
      message:
        "Object parameters may expose at most 4 fields. Introduce a named value object or split the responsibility.",
    },
    {
      selector:
        'CallExpression[callee.type="MemberExpression"][callee.property.type="PrivateIdentifier"] > ObjectExpression[properties.length>4]',
      message:
        "Do not pass wide anonymous objects to private methods. Introduce a named collaborator or value object.",
    },
    {
      selector: "ReturnStatement > ObjectExpression[properties.length>6]",
      message: "Do not return wide anonymous objects. Introduce a named result type or behavioral object.",
    },
  ],
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
  "no-use-before-define": [
    "error",
    { classes: true, functions: false, variables: true },
  ],
  "no-useless-concat": "error",
  "no-useless-return": "error",
  "no-var": "error",
  "object-shorthand": [
    "error",
    "always",
  ],
  "prefer-arrow-callback": "error",
  "prefer-const": "error",
  "prefer-promise-reject-errors": "error",
  "prefer-template": "error",
  "require-atomic-updates": "error",
  "require-await": "error",
  "orchid-charts/multiline-array": "error",
  "orchid-charts/multiline-return-object": "error",
  "import-x/first": "error",
  "import-x/newline-after-import": "error",
  "import-x/no-cycle": [
    "error",
    { ignoreExternal: true, maxDepth: 8 },
  ],
  "import-x/no-duplicates": "error",
  "import-x/no-self-import": "error",
  "import-x/no-useless-path-segments": "error",
  "import-x/order": [
    "error",
    {
      alphabetize: { caseInsensitive: true, order: "asc" },
      groups: [
        "builtin",
        "external",
        "internal",
        "parent",
        "sibling",
        "index",
      ],
      "newlines-between": "always",
    },
  ],
  "promise/no-multiple-resolved": "error",
  "promise/no-nesting": "error",
  "security/detect-object-injection": "off",
  "unicorn/consistent-class-member-order": "off",
  "unicorn/max-nested-calls": "off",
  "unicorn/prefer-iterator-to-array": "off",
  "unicorn/prefer-ternary": "off",
  "unicorn/prefer-scoped-selector": "off",
  "unicorn/prefer-simple-condition-first": "off",
  "unicorn/filename-case": [
    "error",
    {
      case: "pascalCase",
      checkDirectories: false,
      ignore: [
        /^(eslint|stylelint|vite)\.config\.js$/,
      ],
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
  complexity: [
    "error",
    12,
  ],
  "max-depth": [
    "error",
    3,
  ],
  "max-lines": [
    "error",
    { max: 1000, skipBlankLines: true, skipComments: true },
  ],
  "max-lines-per-function": [
    "error",
    { max: 35, skipBlankLines: true, skipComments: true },
  ],
  "max-nested-callbacks": [
    "error",
    3,
  ],
  "max-params": [
    "error",
    3,
  ],
  "max-statements": [
    "error",
    20,
  ],
  "no-magic-numbers": [
    "error",
    {
      ignore: [
        -1,
        0,
        1,
        2,
      ],
      ignoreArrayIndexes: true,
      ignoreDefaultValues: true,
      ignoreClassFieldInitialValues: true,
      enforceConst: true,
      detectObjects: false,
    },
  ],
  "padding-line-between-statements": [
    "error",
    { blankLine: "always", prev: "*", next: "multiline-const" },
    { blankLine: "always", prev: "multiline-const", next: "*" },
    {
      blankLine: "always",
      prev: [
        "const",
        "let",
        "var",
      ],
      next: [
        "if",
        "for",
        "while",
        "switch",
        "try",
      ],
    },
    { blankLine: "always", prev: "block-like", next: "*" },
    {
      blankLine: "always",
      prev: "*",
      next: [
        "return",
        "throw",
      ],
    },
  ],
  "sonarjs/cognitive-complexity": [
    "error",
    15,
  ],
  "sonarjs/expression-complexity": [
    "error",
    { max: 2 },
  ],
  "sonarjs/no-duplicate-string": [
    "error",
    { threshold: 3 },
  ],
};

const architectureRules = {
  "import-x/no-restricted-paths": [
    "error",
    {
      basePath: ".",
      zones: [
        {
          target: "./src/support",
          from: [
            "./src/core",
            "./src/renderers",
          ],
          message: "Support policies must not depend on lifecycle or rendering.",
        },
        {
          target: "./src/renderers",
          from: "./src/core",
          message: "Renderers must not depend on lifecycle owners.",
        },
      ],
    },
  ],
};

const legacyVocabularyRules = [
  {
    selector:
      "Property[key.name=/^(showAxes|showGrid|showLabels|showLegend|showTooltip|showDots|lineOptions|axisOptions|tooltipOptions|barOptions|sectorOptions|timesheetOptions)$/]",
    message: "Legacy chart vocabulary is removed. Use the flat public fluent option name.",
  },
  {
    selector:
      "MemberExpression[computed=false][property.name=/^(showAxes|showGrid|showLabels|showLegend|showTooltip|showDots|lineOptions|axisOptions|tooltipOptions|barOptions|sectorOptions|timesheetOptions)$/]",
    message: "Legacy chart vocabulary is removed. Use the flat public fluent option name.",
  },
];

const jsdocRules = {
  ...jsdocConfigs["flat/recommended-error"].rules,
  "jsdoc/informative-docs": "error",
  "jsdoc/multiline-blocks": [
    "error",
    { noSingleLineBlocks: true },
  ],
  "jsdoc/no-defaults": "off",
  "jsdoc/require-description": "error",
  "jsdoc/require-description-complete-sentence": "error",
  "jsdoc/require-hyphen-before-param-description": "error",
  "jsdoc/require-jsdoc": [
    "error",
    {
      contexts: [
        "FunctionDeclaration",
        "MethodDefinition",
        "Property[method=true]",
      ],
    },
  ],
  "jsdoc/require-param-description": "error",
  "jsdoc/require-returns-description": "error",
  "jsdoc/tag-lines": [
    "error",
    "never",
    { startLines: 1 },
  ],
};

export default [
  {
    ignores: [
      "coverage/**",
      "dist/**",
      "pages-dist/**",
      "node_modules/**",
      "vendor/**",
      ".vitest-attachments/**",
    ],
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
      "orchid-charts": orchidChartsPlugin,
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
    files: [
      "test/**/*.js",
      "test-node/**/*.mjs",
    ],
    rules: {
      "orchid-charts/multiline-array": "off",
      "orchid-charts/max-test-lines": [
        "error",
        { max: 60 },
      ],
      "max-lines": [
        "error",
        { max: 500, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    files: [
      "test/**/*.test.js",
    ],
    plugins: { vitest },
    rules: {
      "vitest/no-focused-tests": "error",
      "vitest/valid-expect": [
        "error",
        { maxArgs: 2 },
      ],
      "vitest/valid-expect-in-promise": "error",
      "vitest/no-conditional-expect": "error",
      "vitest/no-identical-title": "error",
      "vitest/valid-title": "error",
      "vitest/max-nested-describe": [
        "error",
        { max: 2 },
      ],
    },
  },
  {
    files: [
      "test/support/**/*.js",
    ],
    rules: {
      "max-lines-per-function": [
        "error",
        { max: 60, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    files: [
      "test/policies/Normalization.test.js",
      "test/policies/BoundaryPolicies.test.js",
    ],
    rules: { "vitest/no-conditional-in-test": "error", "vitest/prefer-each": "error" },
  },
  {
    files: [
      "test/ChartTicks.test.js",
      "test/TimesheetRendering.test.js",
    ],
    rules: { "vitest/prefer-each": "error" },
  },
  {
    files: SOURCE_FILES,
    plugins: { jsdoc: jsdocPlugin },
    rules: { ...architectureRules, ...maintainabilityRules, ...jsdocRules },
    settings: { jsdoc: { mode: "typescript" } },
  },
  {
    files: [
      "src/**/*.js",
      "test/**/*.js",
    ],
    rules: {
      "no-restricted-syntax": [
        ...correctnessRules["no-restricted-syntax"],
        ...legacyVocabularyRules,
      ],
    },
  },
  {
    files: [
      "test/*.test.js",
      "test/support/VisualFixtures.js",
      "test/support/MountChart.js",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "../src/core/**",
                "../../src/core/**",
              ],
              message:
                "Product tests must exercise the package entry point instead of internal lifecycle classes.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/support/Constants.js",
    ],
    rules: { "no-magic-numbers": "off" },
  },
  {
    files: NODE_FILES,
    rules: {
      ...node.configs["flat/recommended-module"].rules,
      "n/no-missing-import": "error",
      "n/no-process-exit": "error",
      "n/no-unpublished-import": "off",
      "n/prefer-node-protocol": "error",
      "no-console": [
        "error",
        {
          allow: [
            "error",
            "log",
            "warn",
          ],
        },
      ],
      "security/detect-non-literal-fs-filename": "off",
    },
  },
  {
    files: [
      "demo/Main.js",
    ],
    rules: {
      "sonarjs/pseudo-random": "off",
      "unicorn/no-top-level-side-effects": "off",
    },
  },
];
