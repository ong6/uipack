# Component looks

A component (a diagram, a 3D scene, a mechanism) comes in a few named **looks**. Each look keeps a
fixed character and states what it takes from the site it sits on; a site's spec picks the looks it
uses. This page lists every look with its mode, says how a spec picks one, and how to add one.

## Every look

Generated from `COMPONENTS` in `scripts/site-model.ts` by `npm run docs:sync`; `scripts/check-spec.ts`
reads the same list.

<!-- generated:component-looks -->
| Component | Look | Mode | The same on every site | Takes from the site |
| --- | --- | --- | --- | --- |
| [Diagrams](diagrams.md) (`diagrams`, picks one) | `blueprint` Blueprint | `fixed` | Card surface, node shapes and 6px node radius, the four flow colours and packet shapes, label face, strokes, the 11px type floor | Light or dark only |
| [3D object scenes](3d.md) (`3d`, picks several) | `studio` Studio objects | `flex` | Product photography: one object on a seamless sweep, one lens family, shaped key, real shadow | Night room from the ink, rim from the accent; a `palette` prop overrides both |
|  | `paper-theatre` Paper worlds | `fixed` | Cut-card toy theatres, viridian and persimmon frames on cream, one warm lantern | Light or dark only |
|  | `kinetic` Kinetic sculptures | `fixed` | Brass armatures, glazed stoneware, slate bases, a gallery spot at night | Light or dark only |
|  | `cartoon` Cartoon worlds | `fixed` | Floating toy islands, toon ramp, day and night palettes of their own | Light or dark only |
|  | `realistic` Realistic close-ups | `fixed` | Macro still lifes on real surfaces, depth of field, window light by day, a desk lamp at night | Light or dark only |
|  | `abstract` Abstract forms | `fixed` | Refractive glass in front of lacquer bars, a spectral caustic | Light or dark only |
| [Mechanism](mechanism.md) (`mechanism`, picks one) | `isometric` Isometric machine | `flex` | Isometric solids shaded in four tones by facing, one lit part, motion by springs | Tones from the paper and ink, the lit part from the accent, card labels in the label face |
<!-- /generated -->

## Modes

| Mode | Means | A spec that picks it |
| --- | --- | --- |
| `fixed` | Identical on every site; only light and dark follow the host. A reader who met it on one site reads it on another (the blog and the main site share their diagrams) | May not set the values it fixes (its component doc lists them); the checker fails a spec that does |
| `flex` | Keeps its drawing, lighting and motion, and takes the site's roles (palette, faces) as its row says | Sets nothing extra: the look reads the spec's roles |

A look is never recoloured or re-faced locally. A site that wants a fixed look in its own colours
needs a new `flex` look, which is a uipack change for every site.

## How a spec picks

In the spec's frontmatter, one entry per component it uses:

```yaml
components: { diagrams: blueprint, 3d: [studio, realistic], mechanism: isometric }
```

- A component with "picks one" takes one look id; "picks several" takes a list.
- A component the spec leaves out is one the site doesn't use.
- Specs written before 2026-11-06 say `uses: [diagrams]`; the checker reads that as
  `components: { diagrams: blueprint }`. A spec has one or the other, never both.
- The spec's `## Component looks` section says why each look fits the site, and for a several-look
  component which subjects the site shows. 3D subjects offer only some looks; a subject with none of
  the site's picks shows its own default ([3D object scenes](3d.md#which-subjects-offer-each-look)).

`scripts/check-spec.ts` fails a component or look that doesn't exist, a look the component doesn't
offer, two looks for a "picks one" component, and a spec that sets a value a fixed look it picks owns.

## Adding a look

1. Build it in the component (its directions or presets), keeping the component's API.
2. Add it to the component's `looks` in `scripts/site-model.ts`, with its mode, what stays fixed and
   what it takes from the site. A `fixed` look that owns tokens lists them in a generated table in its
   component doc, so the checker can hold specs to them.
3. Document it in the component doc and run `npm run docs:sync`.
4. Only when the owner or a brief asks: a look is a design decision, like a new style.

## Related

- [What a spec may set](../system/spec-settings.md): looks are one row of the boundary.
- [How to write a spec](../specs/README.md) and the [template](../specs/TEMPLATE.md).
- The component references: [diagram catalogue](../diagrams.md), [object scenes](../objects.md),
  [Mechanism](../mechanism.md).
