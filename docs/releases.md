# Releases

How a uipack version is cut and how each site moves to it: the version rules for this repo, the
changelog, the tag on main, and the checks a site runs when it bumps its pin. The sites in the
[site registry](specs/registry.md) are the only consumers, so a release exists to give them a named,
reviewed point to pin instead of a bare commit.

## Version numbers

UiPack is installed from the tarball attached to its GitHub release (below), never from npm. The
version in `package.json` is the latest release; a tag `vX.Y.Z` on main marks the commit it names.
Before 1.0 the numbers mean:

| Bump | When | Examples |
| --- | --- | --- |
| Minor (`0.2.0` → `0.3.0`) | A site that bumps its pin may have to change something, or will look different | An export, entry, prop, role or class name removed or renamed; a style or spec removed; a default that changes what a page draws; a docs path an agent or site links to moved |
| Patch (`0.2.0` → `0.2.1`) | Nothing a site wrote needs to change | A bug fix, a tier-1 fix that keeps every API, a new optional prop or export, docs |

After 1.0 the usual rule applies: a breaking change is a major bump and an addition a minor one.
When in doubt, take the larger bump and say why in the changelog.

## Cutting a release

1. Start from main with CI green.
2. Set `version` in `package.json` (and the two `version` fields at the top of
   `package-lock.json`).
3. In [`CHANGELOG.md`](../CHANGELOG.md), write the version's entry from `git log v<previous>..HEAD`
   (the first release used `683d44b..HEAD`): Added, Changed, Removed, Fixed, one line per change a
   site or agent would notice, and an Upgrading section for anything that breaks.
4. Run `npm run docs:sync`: the [site registry](specs/registry.md) compares each site's pin with the new
   version. Then `npm run build` and the checks in
   [AGENTS.md](../AGENTS.md#engineering-and-verification).
5. Merge to main and wait for CI to pass on it. Then tag it (the owner lets agents tag, 2026-11-08):
   `git tag -a vX.Y.Z -m "uipack X.Y.Z"` on that commit and `git push origin vX.Y.Z`.
6. The tag starts the release workflow (`.github/workflows/release.yml`): it fails unless the tag
   is `v` + `package.json`'s version, then builds, runs the unit tests, packs, and creates the
   GitHub release with `uipack-X.Y.Z.tgz` attached and the version's CHANGELOG section as its
   notes. Watch it (`gh run watch`, in the background), then check the asset installs:
   `npm pack --dry-run https://github.com/ong6/uipack/releases/download/vX.Y.Z/uipack-X.Y.Z.tgz`
   names `uipack@X.Y.Z` and lists `dist/` (`npm view` does not read tarball URLs).
7. To rebuild a release's tarball (a broken asset, a changed note), run the workflow by hand on
   the existing tag: `gh workflow run release -f tag=vX.Y.Z`. It replaces the asset (`--clobber`).
   A site's lockfile records the tarball's integrity hash, so if the new file differs, every site
   pinned to that version fails `npm ci` until it reinstalls; prefer a patch release.

`dist/` is not committed: the tarball is a release's only built copy, so never delete a release
asset a site may still install.

## Installing in a site

```sh
npm install https://github.com/ong6/uipack/releases/download/vX.Y.Z/uipack-X.Y.Z.tgz
```

That writes `"uipack": "https://github.com/ong6/uipack/releases/download/vX.Y.Z/uipack-X.Y.Z.tgz"`
to `package.json`; the lockfile records the tarball's integrity hash. The package is ES modules
only (since 0.4.0): import it from the site's bundler or from a Node ESM script (`.mjs`, or a
`.ts` run with tsx). Pins from before 0.4.0 (`github:ong6/uipack#v0.3.0`, `#v0.2.0` or a commit)
keep installing, because those commits carry the built `dist/`; a git pin to a later commit gets no
`dist/` and does not work.

## Moving a site to a release

In the site's repo, one site at a time:

1. Install the release's tarball ([installing in a site](#installing-in-a-site)).
2. Read the version's entry in `node_modules/uipack/CHANGELOG.md`, Upgrading first, and make the
   changes it lists.
3. Take before and after screenshots of every page that renders uipack, at 1440 and 390, light and
   dark, from the old pin and the new one.
4. Run tier 1 on those pages: `npx uipack-grade check <url> --spec STYLE.md` (or the site's grade
   config; [tier 1](grading/tier-1.md)). It passes before the bump is merged.
5. Back in uipack, set the site's `pins` in `siteRegistry` (`playground/docs-manifest.ts`) and run
   `npm run docs:sync`.
