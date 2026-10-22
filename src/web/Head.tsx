import { createElement, useEffect, type ReactElement } from "react";
import { headTagKey, serializeJsonLd, type HeadTag } from "./seo";

// HTML attribute names that React spells differently.
const REACT_ATTR: Record<string, string> = {
  crossorigin: "crossOrigin",
  "http-equiv": "httpEquiv",
  charset: "charSet",
  hreflang: "hrefLang",
};

function toProps(attrs: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrs)) out[REACT_ATTR[k] ?? k] = v;
  return out;
}

export interface HeadTagsProps {
  tags: HeadTag[];
}

/**
 * Renders head tags as React elements, for a server-rendered document that owns its `<head>`
 * (renderToString / renderToPipeableStream inside `<head>…</head>`). React 18 does not move
 * tags into the head for you; in a client-only app use `useHead` instead.
 */
export function HeadTags({ tags }: HeadTagsProps): ReactElement {
  return (
    <>
      {tags.map((t) => {
        const key = headTagKey(t);
        if (t.tag === "title") return <title key={key}>{t.text}</title>;
        if (t.tag === "script") return <script key={key} {...toProps(t.attrs)} dangerouslySetInnerHTML={{ __html: t.text }} />;
        return createElement(t.tag, { key, ...toProps(t.attrs) });
      })}
    </>
  );
}

const MARK = "data-uipack-head";

function findExisting(t: HeadTag): Element | null {
  const head = document.head;
  if (t.tag === "title") return head.querySelector("title");
  const a = t.attrs;
  if (t.tag === "meta" && a.name) return head.querySelector(`meta[name="${CSS.escape(a.name)}"]`);
  if (t.tag === "meta" && a.property) return head.querySelector(`meta[property="${CSS.escape(a.property)}"]`);
  if (t.tag === "link" && a.rel === "canonical") return head.querySelector('link[rel="canonical"]');
  return null;
}

/**
 * Applies head tags to `document.head` in a client-rendered page: updates an existing title,
 * description, canonical or og:* tag in place, adds what is missing, and restores everything on
 * unmount. Crawlers that do not run JavaScript never see these; server-render the head
 * (`HeadTags` or `headTagsToHtml`) when the page must be found by them.
 */
export function useHead(tags: HeadTag[]): void {
  const signature = JSON.stringify(tags);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const undo: (() => void)[] = [];
    for (const t of JSON.parse(signature) as HeadTag[]) {
      const existing = findExisting(t);
      if (t.tag === "title") {
        const prev = document.title;
        document.title = t.text;
        undo.push(() => (document.title = prev));
        continue;
      }
      if (existing) {
        const prev = Array.from(existing.attributes).map((a) => [a.name, a.value] as const);
        for (const [k, v] of Object.entries(t.attrs)) existing.setAttribute(k, v);
        undo.push(() => {
          for (const a of Array.from(existing.attributes)) existing.removeAttribute(a.name);
          for (const [k, v] of prev) existing.setAttribute(k, v);
        });
        continue;
      }
      const el = document.createElement(t.tag);
      for (const [k, v] of Object.entries(t.attrs)) el.setAttribute(k, v);
      if (t.tag === "script") el.textContent = t.text;
      el.setAttribute(MARK, "");
      document.head.appendChild(el);
      undo.push(() => el.remove());
    }
    return () => undo.reverse().forEach((f) => f());
  }, [signature]);
}

export interface JsonLdProps {
  /** A JSON-LD document, e.g. `jsonLd(organization(...), softwareApplication(...))`. */
  data: unknown;
  id?: string;
}

/**
 * `<script type="application/ld+json">` with the data serialised safely: "<", ">" and "&" are
 * escaped, so text such as "</script>" inside a value cannot break out of the tag. Valid in the
 * head or the body.
 */
export function JsonLd({ data, id }: JsonLdProps) {
  return <script type="application/ld+json" id={id} dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
