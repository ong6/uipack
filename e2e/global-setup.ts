import { execSync } from "node:child_process";

export default function globalSetup() {
  execSync("npx tsx scripts/build-static-fixtures.tsx", { stdio: "inherit" });
  execSync("npx tsx scripts/build-article-fixtures.tsx", { stdio: "inherit" });
}
