import { librarySections, pageDefs, pageHref } from "./catalog";
import { SectionIcon, sectionHueStyle } from "./site-settings";
import "./site-map.css";

/**
 * The site map: the docs' five sections, each under its label and icon, with its groups (a caption
 * over each but the first) and their pages, from the docs manifest. The landing page's footer shows
 * each group's pages (sub-pages and deck sub-views stay on their page); a not-found page passes
 * `every` and lists those too. `heading` is the level of a section's label where the map sits.
 */
export function SiteMap({
  theme,
  every = false,
  heading: Heading = "h3",
}: {
  theme: "light" | "dark";
  every?: boolean;
  heading?: "h2" | "h3";
}) {
  return (
    <div className="landing-map">
      {librarySections.map((section) => (
        <nav
          key={section.id}
          aria-labelledby={`map-${section.id}`}
          className="landing-map__section"
          data-section={section.id}
          style={sectionHueStyle(section.id)}
        >
          <Heading id={`map-${section.id}`} className="landing-map__head">
            <SectionIcon id={section.id} size={15} />
            {section.label}
          </Heading>
          <div className="landing-map__groups">
            {section.groups.map((g) => (
              <div key={g.id} className="landing-map__group">
                {g.caption && <p className="landing-map__caption">{g.caption}</p>}
                <ul>
                  {pageDefs
                    .filter((p) => p.group === g.id && (every || (!p.parent && (!p.query || p.isDefault))))
                    .map((p) => (
                      <li key={p.id}>
                        <a href={pageHref(p, theme)}>
                          {every
                            ? p.query && p.title
                              ? `${p.title} · ${p.label}`
                              : p.label
                            : p.query
                              ? (p.title ?? p.label)
                              : p.label}
                        </a>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      ))}
    </div>
  );
}
