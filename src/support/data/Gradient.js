import { isOpacity, isRecord, unknownKey } from "../Validation.js";

import { validateNumber } from "./InputValidation.js";

/**
 * Validates gradient switches and opacity endpoints.
 *
 * @param {unknown} value - Boolean switch or endpoint record.
 * @returns {void} Supported gradient values pass unchanged.
 */
function validateGradient(value) {
  if (typeof value === "boolean") {
    return;
  }

  if (!isRecord(value)) {
    throw new TypeError("gradient must be a boolean or GradientOptions object");
  }

  const unknown = unknownKey(value, [
    "fromOpacity",
    "toOpacity",
  ]);

  if (unknown) {
    throw new TypeError(`Unsupported gradient option: ${unknown}`);
  }

  for (const endpoint of Object.values(value)) {
    validateNumber(endpoint, "gradient opacity", 0);
    if (!isOpacity(endpoint)) {
      throw new TypeError("gradient opacity must be from 0 through 1");
    }
  }
}

export { validateGradient };
