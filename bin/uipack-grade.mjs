#!/usr/bin/env node
// `npx uipack-grade <command>`: the grading CLI (docs/grading/README.md). Needs `playwright` and its Chromium.
import { main } from "../dist/grade.js";

process.exitCode = await main(process.argv.slice(2));
