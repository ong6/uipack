# Mechanism: the isometric machine look

`uipack/mechanism` draws one real, well-made isometric machine whose working is the concept (the
first is the verification gate). It has one look, **Isometric machine**, and it is `flex`: the
drawing, its four-tone shading and its motion are the same everywhere, and the tones and the one lit
part come from the site's roles. The model behind looks and modes is in [Component looks](README.md);
the API and the machine are in [Mechanism](../mechanism.md).

<!-- generated:component-look-list -->
A spec picks one look: `components: { mechanism: isometric }`.

| Look | Name | Mode | The same on every site | Takes from the site |
| --- | --- | --- | --- | --- |
| `isometric` | Isometric machine | `flex` | Isometric solids shaded in four tones by facing, one lit part, motion by springs | Tones from the paper and ink, the lit part from the accent, card labels in the label face |
<!-- /generated -->

## Fixed on every site

- Isometric solids, each face shaded by its facing in four tones (`lo`, `mid`, `hi`, `lit`).
- One lit part: the thing being judged; the only other accent is the mark it is judged against.
- Pass and return told by route and readout, never by colour alone.
- Motion by springs and exponential follow; pose changes never jump; reduced motion holds each
  pose's still frame.
- No words in the drawing; the card's corners carry mono caps of at least 11px.

## Taken from the site

| Part | Role |
| --- | --- |
| The four tones | Derived from the paper and ink roles (`--tune-mech-*` hooks; Technical's derivation in `src/mechanism/mechanism.css`) |
| The lit part and the limit mark | `--ui-accent` |
| Card corners and readout | The label face (`--ui-font-label`) |
| Card frame | The site's frame border and radius |

TODO: the tone derivation (`--tune-mech-*`) exists for Technical only (see
[Style roles, Where the code stands](../system/style.md#where-the-code-stands)); a second
implemented style needs its own before this look follows it.
