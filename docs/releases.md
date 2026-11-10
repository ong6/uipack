# Releases

How a uipack version is cut and how each site moves to it: the version rules for this repo, the
changelog, the tag on main, and the checks a site runs when it bumps its pin. The sites in the
[registry](specs/registry.md) are the only consumers, so a release exists to give them a named,
reviewed point to pin instead of a bare commit.

## Version numbers

uipack is installed from GitHub (`"uipack": "github:ong6/uipack#v0.2.0"`), never from npm. The
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
4. Run `npm run docs:sync`: the [registry](specs/registry.md) compares each site's pin with the new
   version. Then `npm run build` and the checks in
   [AGENTS.md](../AGENTS.md#engineering-and-verification).
5. Merge to main and wait for CI to pass on it. Then tag it (the owner lets agents tag, 2026-11-08):
   `git tag -a vX.Y.Z -m "uipack X.Y.Z"` on that commit, `git push origin vX.Y.Z`, and create the
   GitHub release from the version's CHANGELOG entry.

## Moving a site to a release

In the site's repo, one site at a time:

1. Set `"uipack": "github:ong6/uipack#vX.Y.Z"` in `package.json` and run `npm install`.
2. Read the version's entry in `node_modules/uipack/CHANGELOG.md`, Upgrading first, and make the
   changes it lists.
3. Take before and after screenshots of every page that renders uipack, at 1440 and 390, light and
   dark, from the old pin and the new one.
4. Run tier 1 on those pages: `npx uipack-grade check <url> --spec STYLE.md` (or the site's grade
   config; [tier 1](grading/tier-1.md)). It passes before the bump is merged.
5. Back in uipack, set the site's `pins` in `siteRegistry` (`playground/docs-manifest.ts`) and run
   `npm run docs:sync`.
