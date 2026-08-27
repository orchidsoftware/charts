export default {
  extends: ["stylelint-config-standard", "stylelint-config-recess-order"],
  rules: {
    "no-descending-specificity": null,
    "selector-class-pattern": "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$",
  },
};
