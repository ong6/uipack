import { type CSSProperties, type ElementType, type ReactNode } from "react";
import { sectionOrder, uiStyles, type UiStyleId, type UiStyleMeta } from "../style";
import { WebSurface, type WebSurfaceProps } from "./Surface";
import { SectionIndexContext } from "./Section";

/** What a section's render function learns about the page it is placed on. */
export interface WebPageContext {
  uiStyle: UiStyleId;
  layout: "style" | "shared";
  /** The layout defaults: shared (demo hero, start edge, cards) unless the page opted into layout="style". */
  defaults: UiStyleMeta["layout"];
}

export interface WebPageProps {
  /** Sections by id. A function receives the page context, e.g. to fill the hero with the style's proof. */
  sections: Record<string, ReactNode | ((page: WebPageContext) => ReactNode)>;
  /** Rendered first, outside the order (a GlassNav). */
  nav?: ReactNode;
  /** The style; default "technical". */
  uiStyle?: UiStyleId;
  /**
   * "shared" (default): the page's own section order (the keys of `sections`) and one layout in
   * every style, so a swap changes tokens and ornaments only. "style" is an explicit opt-in to the
   * style's own sequence and layout defaults (`uiStyles[].prefers` and `.layout`).
   */
  layout?: "style" | "shared";
  /** Or an explicit order of section ids. */
  order?: readonly string[];
  theme?: "light" | "dark";
  /** Figure tool chrome on the page (WebSurface `figureChrome`): "quiet" by default. */
  figureChrome?: WebSurfaceProps["figureChrome"];
  className?: string;
  style?: CSSProperties;
  as?: ElementType;
  children?: ReactNode;
}

/**
 * Each slot's content and its section number: 1, 2, 3… down the page in its order, skipping the
 * hero (it has no section eyebrow) and any slot that renders nothing (null, false, undefined).
 */
export function numberSections(
  ids: readonly string[],
  sections: WebPageProps["sections"],
  page: WebPageContext,
): { id: string; node: ReactNode; index: number | undefined }[] {
  let n = 0;
  return ids.flatMap((id) => {
    const section = sections[id];
    const node = typeof section === "function" ? section(page) : section;
    if (node === null || node === undefined || node === false) return [];
    return [{ id, node, index: id === "hero" ? undefined : ++n }];
  });
}

const SHARED: UiStyleMeta["layout"] = { hero: "demo", align: "start", steps: "cards" };

/**
 * A whole web page in one style: the style's tokens and ornaments (WebSurface) over the page's own
 * section order. Swapping `uiStyle` keeps every section, its words and its position. Opt into a
 * style's own sequence and layout defaults with `layout="style"` (`data-ui-layout="style"`).
 */
export function WebPage({
  sections,
  nav,
  uiStyle = "technical",
  layout = "shared",
  order,
  theme,
  figureChrome,
  className = "",
  style,
  as,
  children,
}: WebPageProps) {
  const meta = uiStyles.find((s) => s.id === uiStyle)!;
  const page: WebPageContext = { uiStyle, layout, defaults: layout === "style" ? meta.layout : SHARED };
  const ids = order ? order.filter((id) => id in sections) : sectionOrder(uiStyle, Object.keys(sections), layout);
  return (
    <WebSurface
      uiStyle={uiStyle}
      theme={theme}
      className={className}
      style={style}
      as={as}
      layout={layout}
      figureChrome={figureChrome}
    >
      {nav}
      {numberSections(ids, sections, page).map(({ id, node, index }) => (
        <SectionIndexContext.Provider key={id} value={index}>
          {node}
        </SectionIndexContext.Provider>
      ))}
      {children}
    </WebSurface>
  );
}
