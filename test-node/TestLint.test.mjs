import test from "node:test";

import { RuleTester } from "eslint";

import { maxTestLines } from "../scripts/TestLintRules.mjs";

const tester = new RuleTester({ languageOptions: { ecmaVersion: "latest", sourceType: "module" } });
const body = "{\n const value = 1;\n expect(value).toBe(1);\n}";
const errors = [{ messageId: "long" }];

test("enforces test length for aliases and each without counting describe or comments", () => {
  tester.run("max-test-lines", maxTestLines, {
    valid: [
      {
        code: `import { describe, it, expect } from 'vitest';
        describe('suite', () => {
          it('first', () => { expect(1).toBe(1); });
          it('second', () => { expect(2).toBe(2); });
        });`,
        options: [{ max: 1 }],
      },
      {
        code: `import { it } from 'vitest'; it('comments do not count', () => {
        // Explanation

        expect(1).toBe(1);
        /* Another explanation */
      });`,
        options: [{ max: 3 }],
      },
      {
        code: `import { it } from 'vitest'; function other(it) { it('not a test', () => ${body}); }`,
        options: [{ max: 1 }],
      },
      { code: `import { it } from 'other'; it('not Vitest', () => ${body});`, options: [{ max: 1 }] },
    ],
    invalid: [
      { code: `import { it } from 'vitest'; it('long', () => ${body});`, options: [{ max: 3 }], errors },
      {
        code: `import { test as check } from 'vitest'; check.each([1])('case', () => ${body});`,
        options: [{ max: 3 }],
        errors,
      },
      {
        code: `import { it } from 'vitest'; it.skipIf(false).each([1])('case', {}, () => ${body});`,
        options: [{ max: 3 }],
        errors,
      },
      { code: `import test from 'node:test'; test('long', () => ${body});`, options: [{ max: 3 }], errors },
    ],
  });
});
