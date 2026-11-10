import js from "@eslint/js";

export default [
  { ignores: ["node_modules/**", ".tools/**", ".cache/**", "coverage/**", "dist/**", "build/**"] },
  js.configs.recommended,
  {
    files: ["**/*.mjs"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        URL: "readonly",
        fetch: "readonly",
        AbortSignal: "readonly",
        Buffer: "readonly",
        Response: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "node:child_process",
              importNames: ["exec", "execSync"],
              message: "Use spawn with an argument array and shell:false.",
            },
          ],
        },
      ],
    },
  },
];
