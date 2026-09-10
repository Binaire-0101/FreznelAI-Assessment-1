import eslint from "@eslint/js";
import tsParser from "@typescript-eslint/parser";

export default [
  { ignores: ["dist"] },
  eslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        indexedDB: "readonly",
        IDBDatabase: "readonly",
      },
    },
    rules: { "no-undef": "off", "no-unused-vars": "off" },
  },
];
