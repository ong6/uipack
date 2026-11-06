// `npm run grade -- <command>`: the uipack-grade CLI from source (src/grade/cli.ts). Consumers run `npx uipack-grade`.
import { main } from "../src/grade/cli";

process.exitCode = await main(process.argv.slice(2));
