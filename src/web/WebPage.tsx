import { Fragment, type CSSProperties, type ElementType, type ReactNode } from "react";
import { sectionOrder, uiStyles, type UiStyleId, type UiStyleMeta } from "../style";
import { WebSurface } from "./Surface";

/** What a section's render function learns about the page it is placed on. */
export interface WebPageContext {
  uiStyle: UiStyleId;
  layout: "style" | "shared";
  /** The style's layout defaults; under layout="shared", the shared defaults (demo hero, centred, cards). */
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
   * "style" (default): the section order and layout defaults the style recommends (`uiStyles[].prefers`
   * and `.layout`). "shared": one order and layout for every style, so a swap changes tokens only.
   */
  layout?: "style" | "shared";
  /** Or an explicit order of section ids. */
  order?: readonly string[];
  theme?: "light" | "dark";
  className?: string;
  style?: CSSProperties;
  as?: ElementType;
  children?: ReactNode;
}

const SHARED: UiStyleMeta["layout"] = { hero: "demo", align: "center", steps: "cards" };

/**
 * A whole web page in one style: the style's tokens and ornaments (WebSurface), its recommended
 * section sequence, and its layout defaults (`data-ui-layout="style"`, which web-styles.css reads:
 * Technical sets the hero and section heads on the start edge and the steps as numbered rows).
 */
export function WebPage({
  sections,
  nav,
  uiStyle = "technical",
  layout = "style",
  order,
  theme,
  className = "",
  style,
  as,
  children,
}: WebPageProps) {
  const meta = uiStyles.find((s) => s.id === uiStyle)!;
  const page: WebPageContext = { uiStyle, layout, defaults: layout === "style" ? meta.layout : SHARED };
  const ids = order ? order.filter((id) => id in sections) : sectionOrder(uiStyle, Object.keys(sections), layout);
  return (
    <WebSurface uiStyle={uiStyle} theme={theme} className={className} style={style} as={as} layout={layout}>
      {nav}
      {ids.map((id) => {
        const section = sections[id];
        return <Fragment key={id}>{typeof section === "function" ? section(page) : section}</Fragment>;
      })}
      {children}
    </WebSurface>
  );
}
