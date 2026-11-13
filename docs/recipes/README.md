# Recipes

One recipe per page type: the section order, the parts to build it from (real exports), and the
writing and layout files it relies on. Pick the recipe for your page, then follow the site's spec
for the look ([Technical spec](../specs/technical.md) on this site; [one spec per site](../specs/README.md)).

| Page type | Recipe | Example to compare against |
| --- | --- | --- |
| Landing | [landing.md](landing.md) | The [example landing page](../examples/landing-page.md) |
| Documentation and article | [documentation.md](documentation.md) | The [example text page](../examples/text-page.md) |
| Deck slide | [deck-slide.md](deck-slide.md) | The [Tech talk deck](../deck.md) |
| Dashboard | [dashboard.md](dashboard.md) | None in this repo yet |

Every recipe works the same way:

1. Write the claim, then the copy, from the writing file the recipe names.
2. Lay the page out in the recipe's order, with the parts it lists.
3. Paint it with the site's spec; a style never moves a section.
4. Check it at 1440 and 390, light and dark, against the example.

Section orders in these files are generated from the code that renders them where one exists
(`npm run docs:sync`), so a recipe cannot drift from its example.
