#!/usr/bin/env node
// `npx uipack-figure-check <url> [--views 1440,390]`: the figure geometry check (uipack-figure-check.mjs,
// which a test imports, so it carries no shebang). Needs `playwright` and its Chromium.
import { main } from "./uipack-figure-check.mjs";

process.exitCode = await main(process.argv.slice(2));
