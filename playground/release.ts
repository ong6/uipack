// Data only: the release a site installs. scripts/docs-sync.ts writes the install line into the
// docs (README.md, docs/README.md, llms.txt) from these, and the landing page shows the same line,
// so neither goes stale when package.json's version moves.

/** The release tarball the release workflow attaches to tag `v<version>` (.github/workflows/release.yml). */
export const tarballUrl = (version: string) =>
  `https://github.com/ong6/uipack/releases/download/v${version}/uipack-${version}.tgz`;

/** The command a site runs to install a release. */
export const installLine = (version: string) => `npm install ${tarballUrl(version)}`;
