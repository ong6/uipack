// Server rendering from a jsdom test file, as a real server would do it. Modules decide some things
// when they load (useIsoLayoutEffect is useLayoutEffect wherever `window` exists), so the modules
// `run` imports are loaded fresh with no window or document, and are dropped again afterwards.
// Import the components inside `run`: the file's own imports were loaded with jsdom's window.
// Like vi.unstubAllGlobals, it restores every global stubbed with vi.stubGlobal: call it first.
import { vi } from "vitest";

type Server = typeof import("react-dom/server");

export async function onServer<T>(run: (server: Server) => T | Promise<T>): Promise<T> {
  vi.stubGlobal("window", undefined);
  vi.stubGlobal("document", undefined);
  vi.resetModules();
  try {
    return await run(await import("react-dom/server"));
  } finally {
    vi.unstubAllGlobals();
    vi.resetModules();
  }
}
