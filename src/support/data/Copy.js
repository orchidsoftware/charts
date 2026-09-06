/**
 * Copies caller-owned authoring data while retaining formatter callbacks by reference.
 *
 * @param {unknown} value - Value crossing the fluent authoring boundary.
 * @returns {unknown} Independent arrays, records, and dates suitable for builder state.
 */
function copyInput(value) {
  if (value instanceof Date) {
    return new Date(value.valueOf());
  }

  if (Array.isArray(value)) {
    return value.map((item) => copyInput(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(
        ([
          key,
          item,
        ]) => [
          key,
          copyInput(item),
        ],
      ),
    );
  }

  return value;
}

export { copyInput };
