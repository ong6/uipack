// uipack's docs are read by agents: every file is a few links from an entry file, opens with what
// it is for, and is headed so an agent can jump to its part (scripts/check-agent-docs.ts,
// docs/grading/agent-docs.md).
import { agentDocsFailures, agentDocsReport, opening } from "../scripts/check-agent-docs";

describe("agent docs", () => {
  it("every docs file is reachable, opens with its purpose and is headed", () => {
    expect(agentDocsFailures(), "see docs/grading/agent-docs.md").toEqual([]);
  });

  it("reads the opening paragraph, not a table or code first", () => {
    expect(opening("# T\n\nThe reference for X: what it is for.\n\n## A\n").ok).toBe(true);
    expect(opening("# T\n\n| a | b |\n").ok).toBe(false);
    expect(opening("# T\n\n```tsx\nx\n```\n").ok).toBe(false);
    expect(opening("---\nspec: x\n---\n\n# T\n\nWhat it is for.\n").ok).toBe(true);
  });

  it("reports every docs file", () => {
    expect(agentDocsReport().length).toBeGreaterThan(50);
  });
});
