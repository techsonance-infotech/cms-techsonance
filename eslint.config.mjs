import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import oxlint from "eslint-plugin-oxlint";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "docs/**",
      "graphify-out/**",
      ".gitnexus/**",
      "coverage/**",
    ],
  },
  {
    plugins: {
      "@next/next": nextPlugin,
      react: reactPlugin,
      "react-hooks": hooksPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  ...oxlint.configs["flat/recommended"],
  ...oxlint.configs["flat/nextjs"],
  ...oxlint.configs["flat/react"],
];

export default eslintConfig;