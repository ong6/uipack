// Discoverability data for the /web demo page ("Tidy", an illustrative product with no real
// facts). One module feeds the page's head, its JSON-LD, its FAQ and the crawl files, in the
// browser and in scripts/build-crawl-files.ts, so they cannot disagree.
import {
  buildCrawlFiles,
  jsonLd,
  offer,
  organization,
  pageMeta,
  softwareApplication,
  webSite,
  type BuildCrawlFilesOptions,
  type FaqItem,
} from "../src/web";

/** The day this demo's copy last changed, for sitemap lastmod. Update it with the copy. */
export const TIDY_UPDATED = "2026-10-22";

export const tidyFaq: FaqItem[] = [
  {
    question: "What does Tidy do?",
    answer:
      "Tidy is an inbox agent that reads, files and drafts replies to your email while you watch. You describe the outcome in one sentence, it lists each action as it takes it, and it leaves you only the messages that need a person.",
  },
  {
    question: "How much does Tidy cost?",
    answer: "Tidy costs $8 a month for one inbox, after a free 30-day trial that needs no card.",
  },
  {
    question: "Can I undo what Tidy does?",
    answer:
      "Yes, every action Tidy takes is listed as it happens, and you can stop or undo it from that list. Nothing is deleted: archived and filed messages stay in your mailbox.",
  },
  {
    question: "Does Tidy send email for me?",
    answer: "No, Tidy drafts replies but never sends them. Drafts wait for you to review, edit and send yourself.",
  },
];

const description =
  "Tidy, an illustrative inbox agent, reads, files and drafts while you watch and leaves only the messages that need you. A UIPACK Landing-style demo page.";

/** Everything the demo page publishes about itself, for a page served at `${origin}/web`. */
export function tidySeo(origin: string) {
  const url = `${origin.replace(/\/$/, "")}/web`;
  const org = organization({ name: "Tidy", url, description: "Illustrative company behind the UIPACK Landing demo." });
  const plan = offer({
    name: "Tidy",
    price: "8.00",
    priceCurrency: "USD",
    billing: "MON",
    trialDays: 30,
    url: `${url}#web-pricing`,
  });
  const crawl: BuildCrawlFilesOptions = {
    site: origin,
    pages: [
      {
        path: "/web",
        title: "Tidy: forty emails in, three that need you",
        description: "The demo landing page: product demo, how it works, FAQ and pricing.",
        lastmod: TIDY_UPDATED,
      },
      {
        path: "https://github.com/ong6/uipack/blob/main/docs/web-discoverability.md",
        title: "How this page is made discoverable",
        description: "The checklist and helpers behind this page's head, JSON-LD and crawl files.",
        section: "Docs",
      },
      {
        path: "https://github.com/ong6/uipack/blob/main/docs/web-principles.md",
        title: "Landing web principles",
        description: "The design rules behind the Landing style, each with its source.",
        optional: true,
      },
    ],
    llms: {
      title: "Tidy (UIPACK Landing demo)",
      summary:
        "Tidy is an illustrative inbox agent: it reads, files and drafts replies while you watch, and leaves only the messages that need a person.",
      details:
        "Tidy is not a real product. The page demonstrates the Landing style of uipack/web, and its prices and answers are example copy.",
    },
  };
  return {
    url,
    meta: pageMeta({
      title: "Tidy: forty emails in, three that need you",
      description,
      url,
      siteName: "Tidy (UIPACK demo)",
      type: "website",
    }),
    jsonLd: jsonLd(
      org,
      webSite({ name: "Tidy", url, publisher: org }),
      softwareApplication({
        name: "Tidy",
        type: "WebApplication",
        description: "Illustrative inbox agent from the UIPACK Landing demo; not a real product.",
        url,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: plan,
        publisher: org,
      }),
    ),
    crawl,
    files: buildCrawlFiles(crawl),
  };
}
