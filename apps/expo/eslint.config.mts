import { defineConfig } from "eslint/config";

import { baseConfig } from "@tera/eslint-config/base";
import { reactConfig } from "@tera/eslint-config/react";

export default defineConfig(
  {
    ignores: [".expo/**", "expo-plugins/**"],
  },
  baseConfig,
  reactConfig,
);
