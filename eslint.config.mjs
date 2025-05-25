import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      // Build artifacts and generated files
      ".next/**",
      "out/**",
      "dist/**",
      "build/**",
      // Dependencies
      "node_modules/**",
      // Config files
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
      // Environment files
      ".env*",
      // Git and other VCS
      ".git/**",
      // Coverage reports
      "coverage/**",
      // Logs
      "*.log",
      "logs/**",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // Disable some noisy rules for this project
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@next/next/no-img-element": "off",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
