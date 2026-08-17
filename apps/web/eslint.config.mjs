import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // scripts/** is standalone build tooling (never bundled into the app,
    // not part of tsconfig's `include`); data/** is a generated build
    // artifact (see scripts/build-data.mjs); .wrangler/** is Wrangler's
    // local dev-server cache (created by `wrangler dev`/`npm run
    // verify:worker`, can contain a large bundled worker snapshot) --
    // none of these are application source.
    ignores: [".next/**", ".open-next/**", ".wrangler/**", "node_modules/**", "next-env.d.ts", "scripts/**", "data/**"],
  },
];

export default eslintConfig;
