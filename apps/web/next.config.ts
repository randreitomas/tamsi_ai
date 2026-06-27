import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: join(currentDirectory, "../.."),
  transpilePackages: ["@tamsi/academic-engine", "@tamsi/ai", "@tamsi/types", "@tamsi/ui"]
};

export default nextConfig;
