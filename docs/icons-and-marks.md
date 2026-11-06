# Icons and marks

Every icon, mark, canvas background and motion token UiPack ships, searchable, each with a
preview and a copy button for its import line or SVG. Diagrams are coded figures, so they live in
the [diagram catalogue](diagrams.md) instead.

## Using an asset

- Filter by category, search by name or tag, then copy the import line or the SVG.
- Icons and marks are drawn from the role layer, so they repaint with the site's spec and theme;
  never recolour one with a raw value.
- The list is `assets/manifest.json` (rebuilt by `npm run manifest`); the package exports it as
  `uipack/assets/manifest.json`, and `AssetBrowser` from `uipack/browser` is the browser below.

## Browse

```uipack-demo asset-browser wide
The asset browser: category filters, search, a preview per asset and copy buttons for the import line and the SVG.
```
