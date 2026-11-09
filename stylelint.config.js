import { propertyGroups } from "stylelint-config-clean-order";

export default {
  extends: [
    "stylelint-config-standard",
  ],
  plugins: [
    "stylelint-order",
  ],
  rules: {
    "order/properties-order": [
      propertyGroups.map((properties) => ({ properties })),
      { unspecified: "bottomAlphabetical" },
    ],
    "no-descending-specificity": null,
    "selector-class-pattern": "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$",
  },
};
