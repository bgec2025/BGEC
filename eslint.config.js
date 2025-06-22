import globals from "globals";

export default [
  {
    files: ["**/*.js", "**/*.vue"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "no-alert": "off",
    },
  },
];
