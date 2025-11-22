import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
await jiti.import("./src/env");

/** @type {import("next").NextConfig} */
const config = {
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@tera/api",
    "@tera/auth",
    "@tera/db",
    "@tera/utils",
    "@tera/validators",
  ],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oq3ywfdlbc.ufs.sh",
        pathname: "/f/*",
      },
    ],
  },

  /** We already do linting and typechecking as separate tasks in CI */
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ["pg"],
};

export default config;
