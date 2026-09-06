function rootIdentifier(node) {
  let current = node;
  while (
    [
      "MemberExpression",
      "CallExpression",
      "TaggedTemplateExpression",
    ].includes(current.type)
  ) {
    current = current.object ?? current.callee ?? current.tag;
  }
  return current;
}

function importedTest(sourceCode, identifier) {
  let scope = sourceCode.getScope(identifier);
  while (scope) {
    const binding = scope.set.get(identifier.name);
    if (binding) {
      return binding.defs.some(({ type, node, parent }) => {
        if (type !== "ImportBinding") {
          return false;
        }
        const module = parent.source.value;
        const name = node.imported?.name ?? "default";
        return (
          (module === "vitest" &&
            [
              "it",
              "test",
            ].includes(name)) ||
          (module === "node:test" &&
            [
              "default",
              "it",
              "test",
            ].includes(name))
        );
      });
    }
    scope = scope.upper;
  }
  return false;
}

function codeLineCount(sourceCode, node) {
  const lines = new Set();
  for (const token of sourceCode.getTokens(node)) {
    for (let line = token.loc.start.line; line <= token.loc.end.line; line += 1) {
      lines.add(line);
    }
  }
  return lines.size;
}

export const maxTestLines = {
  meta: {
    type: "suggestion",
    docs: { description: "Keep each test focused without counting the enclosing describe suite." },
    schema: [
      { type: "object", properties: { max: { type: "integer", minimum: 1 } }, additionalProperties: false },
    ],
    messages: {
      long: "This test has {{actual}} code lines (maximum {{max}}). Split independent contracts; keep inputs and expectations visible.",
    },
  },
  create(context) {
    const max = context.options[0]?.max ?? 60;
    return {
      CallExpression(node) {
        const root = rootIdentifier(node.callee);
        if (root.type !== "Identifier" || !importedTest(context.sourceCode, root)) {
          return;
        }
        const callback = node.arguments.find((argument) =>
          [
            "ArrowFunctionExpression",
            "FunctionExpression",
          ].includes(argument.type),
        );
        if (!callback) {
          return;
        }
        const actual = codeLineCount(context.sourceCode, callback);
        if (actual > max) {
          context.report({ node: callback, messageId: "long", data: { actual, max } });
        }
      },
    };
  },
};
