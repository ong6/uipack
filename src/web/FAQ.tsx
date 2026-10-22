import type { ReactNode } from "react";
import { Section, type SectionProps } from "./Section";
import { Heading } from "./Text";
import { JsonLd } from "./Head";
import { faqPage, jsonLd as toJsonLd, slugify, type FaqItem } from "./seo";

export type { FaqItem } from "./seo";

export interface FAQProps {
  /**
   * The questions. Answers are plain text: the first sentence answers the question on its own,
   * so an answer engine can quote it without the rest; blank lines separate paragraphs.
   */
  items: FaqItem[];
  eyebrow?: ReactNode;
  title?: ReactNode;
  intro?: ReactNode;
  /** Section id, for nav links. Default "faq". */
  id?: string;
  /** The page's canonical URL, used for the FAQPage "@id". */
  url?: string;
  /** Emit FAQPage JSON-LD built from the same items. Default true. */
  jsonLd?: boolean;
  /**
   * "list" (default): every answer visible under an h3, which reads best for people, screen
   * reader heading navigation and crawlers. "accordion": native `<details>`, answers collapsed but
   * still in the HTML.
   */
  variant?: "list" | "accordion";
  tone?: SectionProps["tone"];
  /**
   * Skip rendering work while off screen (content-visibility: auto). Default false: turn it on when
   * no in-page link target (a pricing anchor, a closing CTA) sits below the FAQ.
   */
  lazyRender?: boolean;
}

const paragraphs = (answer: string) =>
  answer
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/**
 * Questions and answers whose visible text and FAQPage JSON-LD come from one array, so the
 * markup can never say something the page does not.
 */
export function FAQ({
  items,
  eyebrow = "FAQ",
  title = "Questions, answered",
  intro,
  id = "faq",
  url,
  jsonLd = true,
  variant = "list",
  tone,
  lazyRender = false,
}: FAQProps) {
  const answer = (item: FaqItem) => (
    <div className="uipack-web-faq__answer">
      {paragraphs(item.answer).map((p, i) => (
        <p key={i} className="uipack-web-body" data-emphasis="medium">
          {p}
        </p>
      ))}
    </div>
  );
  const itemId = (item: FaqItem) => item.id ?? `${id}-${slugify(item.question)}`;
  return (
    <Section id={id} eyebrow={eyebrow} title={title} intro={intro} tone={tone} lazyRender={lazyRender} className="uipack-web-faq">
      <div className="uipack-web-faq__list" data-variant={variant}>
        {items.map((item) =>
          variant === "accordion" ? (
            <details key={item.question} className="uipack-web-faq__item" id={itemId(item)}>
              <summary>
                <span className="uipack-web-faq__q">{item.question}</span>
                <span className="uipack-web-faq__icon" aria-hidden="true" />
              </summary>
              {answer(item)}
            </details>
          ) : (
            <div key={item.question} className="uipack-web-faq__item" id={itemId(item)}>
              <Heading level={3} size={1} className="uipack-web-faq__q">
                {item.question}
              </Heading>
              {answer(item)}
            </div>
          ),
        )}
      </div>
      {jsonLd && <JsonLd data={toJsonLd(faqPage(items, { url }))} />}
    </Section>
  );
}
