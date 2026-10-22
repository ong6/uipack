import { DocsLayout, DocsMarkdown, extractDocsHeadings, type DocsSection } from "../src/docs";
import "../src/docs/docs.css";
import "./docs-showcase.css";
import { docsEntries } from "./catalog";
import { useShowcaseTheme } from "./ShowcaseShell";

// The page's h1 is the playground's; the sample document starts at its h2 sections.
const source = `Example product checks a pull request against the team's review rules before a person reads it. This page takes you from install to a first passing run in about five minutes.

## Install

Add the CLI to the repository as a development dependency, then confirm it runs.

\`\`\`sh
npm install --save-dev @example/review
npx review --version
\`\`\`

> **Note:** On a narrow screen, documentation navigation moves into a disclosure and the local table of contents is hidden.

## Configure your first rule

Rules live in \`review.config.ts\` at the repository root. Each one names what it checks, how serious a miss is, and where it applies.

\`\`\`ts
import { defineConfig } from "@example/review";

export default defineConfig({
  rules: [
    {
      id: "answer-first",
      check: "The description opens with the decision it asks for.",
      severity: "error",
      paths: ["docs/**", "proposals/**"],
    },
  ],
});
\`\`\`

### Choose a severity

| Severity | On a miss | Use it for |
|---|---|---|
| \`error\` | Fails the check | Rules the team has agreed on |
| \`warn\` | Comments, passes | Rules you are still trying out |
| \`off\` | Nothing | Pausing a rule without deleting it |

### Scope it to paths

\`paths\` takes globs relative to the root. Leave it out to check every changed file.

## Run it on a pull request

Run the check locally first; the same command runs in CI.

\`\`\`sh
npx review --base main
\`\`\`

Each miss prints the rule, the file and line, and the sentence that broke it, so the author can fix it before asking for review.

### Read the result

A run exits with \`0\` when every \`error\` rule passes and \`1\` otherwise, so CI needs no extra parsing. Warnings print but never fail the run.
`;

const sections: DocsSection[] = [
  {
    title: "Start here",
    items: [
      { title: "Overview", href: "/docs" },
      { title: "Getting started", href: "/docs/getting-started" },
    ],
  },
  {
    title: "How it works",
    items: [
      { title: "System overview", href: "/docs/system-overview" },
      { title: "Rules and severities", href: "/docs/rules" },
      { title: "Operations", href: "/docs/operations" },
    ],
  },
  {
    title: "Reference",
    items: [
      { title: "Configuration", href: "/docs/configuration" },
      { title: "CLI", href: "/docs/cli" },
    ],
  },
];

export default function DocsShowcase() {
  const { theme } = useShowcaseTheme();
  const onThisPage = extractDocsHeadings(source)
    .filter((heading) => heading.level === 2 || heading.level === 3)
    .map(({ id, level, title }) => ({
      id,
      level: level as 2 | 3,
      title,
    }));

  return (
    <>
      <section data-route="docs" data-catalog-entry={docsEntries[0].id}>
        <h2>{docsEntries[0].title}</h2>
        <div className="docs-frame">
          <DocsLayout
            productTitle="Example product"
            productHref="/docs"
            sections={sections}
            activeHref="/docs"
            onThisPage={onThisPage}
            next={{ title: "Getting started", href: "/docs/getting-started" }}
            theme={theme}
            palette="technical"
          >
            <DocsMarkdown source={source} />
          </DocsLayout>
        </div>
      </section>
    </>
  );
}
